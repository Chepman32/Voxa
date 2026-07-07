package com.voxa

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager

class VoxaOfflinePackage : ReactPackage {
  override fun createNativeModules(
      reactContext: ReactApplicationContext
  ): List<NativeModule> = listOf(VoxaOfflineModule(reactContext))

  override fun createViewManagers(
      reactContext: ReactApplicationContext
  ): List<ViewManager<in Nothing, in Nothing>> = emptyList()

  override fun getModule(
      name: String,
      reactContext: ReactApplicationContext
  ): NativeModule? =
      if (name == VoxaOfflineModule.NAME) VoxaOfflineModule(reactContext) else null
}
