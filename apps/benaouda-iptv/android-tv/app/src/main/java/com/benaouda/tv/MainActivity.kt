package com.benaouda.tv

import android.content.ActivityNotFoundException
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.appcompat.app.AppCompatActivity
import androidx.webkit.JavaScriptReplyProxy
import androidx.webkit.WebMessageCompat
import androidx.webkit.WebViewAssetLoader
import androidx.webkit.WebViewCompat
import androidx.webkit.WebViewFeature
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URI
import java.net.URL
import java.util.concurrent.Executors

class MainActivity : AppCompatActivity() {
    private lateinit var webView: WebView
    private val jellyfinExecutor = Executors.newSingleThreadExecutor()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        webView = findViewById(R.id.webView)
        val assetLoader = WebViewAssetLoader.Builder()
            .addPathHandler("/assets/", WebViewAssetLoader.AssetsPathHandler(this))
            .build()

        val settings: WebSettings = webView.settings
        settings.javaScriptEnabled = true
        settings.domStorageEnabled = true
        settings.databaseEnabled = true
        settings.allowFileAccess = false
        settings.allowContentAccess = false
        settings.cacheMode = WebSettings.LOAD_DEFAULT
        settings.setSupportZoom(false)
        settings.builtInZoomControls = false
        settings.mixedContentMode = WebSettings.MIXED_CONTENT_COMPATIBILITY_MODE

        webView.webViewClient = object : WebViewClient() {
            override fun shouldInterceptRequest(
                view: WebView?,
                request: WebResourceRequest?
            ): WebResourceResponse? {
                return request?.url?.let(assetLoader::shouldInterceptRequest)
            }

            override fun shouldOverrideUrlLoading(
                view: WebView?,
                request: WebResourceRequest?
            ): Boolean {
                val uri = request?.url ?: return true
                if (!request.isForMainFrame || isAppAssetUrl(uri)) return false

                return try {
                    startActivity(Intent(Intent.ACTION_VIEW, uri))
                    true
                } catch (_: ActivityNotFoundException) {
                    true
                }
            }
        }

        installJellyfinBridge()
        webView.loadUrl("$APP_ORIGIN/assets/benaouda/index.html")
    }

    private fun installJellyfinBridge() {
        if (!WebViewFeature.isFeatureSupported(WebViewFeature.WEB_MESSAGE_LISTENER)) return

        WebViewCompat.addWebMessageListener(
            webView,
            JELLYFIN_BRIDGE_NAME,
            setOf(APP_ORIGIN)
        ) { _, message: WebMessageCompat, sourceOrigin: Uri, isMainFrame: Boolean, replyProxy: JavaScriptReplyProxy ->
            if (!isMainFrame || sourceOrigin.toString().trimEnd('/') != APP_ORIGIN) return@addWebMessageListener

            val payload = message.data ?: return@addWebMessageListener
            jellyfinExecutor.execute {
                replyProxy.postMessage(handleJellyfinRequest(payload))
            }
        }
    }

    private fun handleJellyfinRequest(payload: String): String {
        var connection: HttpURLConnection? = null
        var requestId = ""

        return try {
            val request = JSONObject(payload)
            requestId = request.optString("id")
            val serverUri = URI(request.getString("serverUrl"))
            val targetUri = URI(request.getString("url"))
            validateJellyfinTarget(serverUri, targetUri)

            connection = URL(targetUri.toASCIIString()).openConnection() as HttpURLConnection
            connection.connectTimeout = CONNECT_TIMEOUT_MS
            connection.readTimeout = READ_TIMEOUT_MS
            connection.instanceFollowRedirects = false
            connection.requestMethod = request.getString("method").uppercase()

            val headers = request.optJSONObject("headers") ?: JSONObject()
            setAllowedRequestHeader(connection, headers, "Accept")
            setAllowedRequestHeader(connection, headers, "Authorization")
            setAllowedRequestHeader(connection, headers, "Content-Type")

            val bodyValue = request.opt("body")
            if (bodyValue != null && bodyValue != JSONObject.NULL) {
                connection.doOutput = true
                connection.outputStream.use { output ->
                    output.write(bodyValue.toString().toByteArray(Charsets.UTF_8))
                }
            }

            val statusCode = connection.responseCode
            val responseStream = if (statusCode >= 400) connection.errorStream else connection.inputStream
            val responseBody = responseStream?.bufferedReader(Charsets.UTF_8)?.use { it.readText() } ?: ""
            JSONObject()
                .put("id", requestId)
                .put("status", statusCode)
                .put("body", responseBody)
                .toString()
        } catch (error: Exception) {
            JSONObject()
                .put("id", requestId)
                .put("error", error.message ?: "Unable to reach the Jellyfin server.")
                .toString()
        } finally {
            connection?.disconnect()
        }
    }

    private fun validateJellyfinTarget(server: URI, target: URI) {
        require(server.scheme == "http" || server.scheme == "https") {
            "The Jellyfin server must use HTTP or HTTPS."
        }
        require(target.scheme == server.scheme && target.host.equals(server.host, ignoreCase = true)) {
            "Jellyfin request is outside the configured server."
        }
        require(effectivePort(target) == effectivePort(server)) {
            "Jellyfin request is outside the configured server."
        }
        require(server.userInfo == null && target.userInfo == null && target.fragment == null) {
            "Invalid Jellyfin server address."
        }

        val basePath = server.path.trimEnd('/')
        val requestPath = target.path
        require(requestPath.startsWith("$basePath/") || requestPath == basePath) {
            "Jellyfin request is outside the configured server."
        }
        require(targetPathIsSafe(requestPath)) {
            "Invalid Jellyfin request path."
        }
    }

    private fun targetPathIsSafe(path: String): Boolean {
        return path.split('/').none { it == "." || it == ".." }
    }

    private fun effectivePort(uri: URI): Int {
        if (uri.port != -1) return uri.port
        return if (uri.scheme == "https") 443 else 80
    }

    private fun setAllowedRequestHeader(
        connection: HttpURLConnection,
        headers: JSONObject,
        name: String
    ) {
        val value = headers.optString(name)
        if (value.isNotEmpty()) connection.setRequestProperty(name, value)
    }

    private fun isAppAssetUrl(uri: Uri): Boolean {
        return uri.scheme == "https" &&
            uri.host == APP_ASSET_HOST &&
            uri.path?.startsWith("/assets/") == true
    }

    override fun onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack()
        } else {
            super.onBackPressed()
        }
    }

    override fun onDestroy() {
        jellyfinExecutor.shutdownNow()
        webView.destroy()
        super.onDestroy()
    }

    companion object {
        private const val APP_ASSET_HOST = "appassets.androidplatform.net"
        private const val APP_ORIGIN = "https://$APP_ASSET_HOST"
        private const val JELLYFIN_BRIDGE_NAME = "JellyfinBridge"
        private const val CONNECT_TIMEOUT_MS = 15_000
        private const val READ_TIMEOUT_MS = 30_000
    }
}
