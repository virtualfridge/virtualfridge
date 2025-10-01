package com.cpen321.usermanagement.utils

import org.json.JSONObject

object JsonUtils {
    fun parseErrorMessage(errorBodyString: String?, fallback: String): String {
        if (errorBodyString.isNullOrEmpty()) return fallback
        return try {
            val json = JSONObject(errorBodyString)
            json.optString("message", fallback)
        } catch (e: org.json.JSONException) {
            android.util.Log.w("JsonUtils", "Failed to parse JSON: ${e.message}")
            fallback
        } catch (e: IllegalArgumentException) {
            android.util.Log.w("JsonUtils", "Invalid JSON string: ${e.message}")
            fallback
        }
    }

}
