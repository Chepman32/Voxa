#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(VoxaOfflineModule, NSObject)

RCT_EXTERN_METHOD(
  requestAuthorizations:(RCTPromiseResolveBlock)resolve
  rejecter:(RCTPromiseRejectBlock)reject
)

RCT_EXTERN_METHOD(
  prepareProject:(NSString *)videoURI
  locale:(NSString *)locale
  resolver:(RCTPromiseResolveBlock)resolve
  rejecter:(RCTPromiseRejectBlock)reject
)

RCT_EXTERN_METHOD(
  exportProject:(NSDictionary *)payload
  resolver:(RCTPromiseResolveBlock)resolve
  rejecter:(RCTPromiseRejectBlock)reject
)

RCT_EXTERN_METHOD(
  saveVideoToPhotos:(NSString *)videoURI
  resolver:(RCTPromiseResolveBlock)resolve
  rejecter:(RCTPromiseRejectBlock)reject
)

@end
