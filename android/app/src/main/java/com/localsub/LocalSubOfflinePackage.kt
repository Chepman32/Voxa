package com.localsub

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager

class LocalSubOfflinePackage : ReactPackage {
  override fun createNativeModules(
      reactContext: ReactApplicationContext
  ): List<NativeModule> = listOf(LocalSubOfflineModule(reactContext))

  override fun createViewManagers(
      reactContext: ReactApplicationContext
  ): List<ViewManager<in Nothing, in Nothing>> = emptyList()

  override fun getModule(
      name: String,
      reactContext: ReactApplicationContext
  ): NativeModule? =
      if (name == LocalSubOfflineModule.NAME) LocalSubOfflineModule(reactContext) else null
}
