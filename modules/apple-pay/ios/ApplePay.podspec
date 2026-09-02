Pod::Spec.new do |s|
  s.name           = 'ApplePay'
  s.version        = '1.0.0'
  s.summary        = 'Apple Pay checkout for Like:Me'
  s.description    = 'Presents PassKit and returns the payment token for Pagar.me'
  s.author         = 'Like:Me'
  s.homepage       = 'https://likeme.app'
  s.license        = 'UNLICENSED'
  s.platforms      = { :ios => '15.5' }
  s.source         = { git: '' }
  s.static_framework = true
  s.dependency 'ExpoModulesCore'
  s.source_files = '*.swift'
end
