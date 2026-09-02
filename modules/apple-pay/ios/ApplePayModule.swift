import ExpoModulesCore
import PassKit

enum ApplePayNativeError: LocalizedError {
  case cancelled
  case unavailable
  case invalidToken

  var errorDescription: String? {
    switch self {
    case .cancelled:
      return "Apple Pay cancelled"
    case .unavailable:
      return "Apple Pay indisponível neste dispositivo"
    case .invalidToken:
      return "Token do Apple Pay inválido"
    }
  }
}

private final class ApplePaySession: NSObject, PKPaymentAuthorizationControllerDelegate {
  private var continuation: CheckedContinuation<[String: Any], Error>?
  private var controller: PKPaymentAuthorizationController?

  func authorize(_ request: PKPaymentRequest) async throws -> [String: Any] {
    try await withCheckedThrowingContinuation { continuation in
      self.continuation = continuation
      let controller = PKPaymentAuthorizationController(paymentRequest: request)
      controller.delegate = self
      self.controller = controller
      controller.present { presented in
        if !presented {
          continuation.resume(throwing: ApplePayNativeError.unavailable)
          self.continuation = nil
        }
      }
    }
  }

  func paymentAuthorizationControllerDidFinish(_ controller: PKPaymentAuthorizationController) {
    controller.dismiss { [weak self] in
      guard let self, let continuation = self.continuation else {
        return
      }
      continuation.resume(throwing: ApplePayNativeError.cancelled)
      self.continuation = nil
    }
  }

  func paymentAuthorizationController(
    _ controller: PKPaymentAuthorizationController,
    didAuthorizePayment payment: PKPayment,
    handler completion: @escaping (PKPaymentAuthorizationResult) -> Void
  ) {
    guard let tokenJson = String(data: payment.token.paymentData, encoding: .utf8),
          !tokenJson.isEmpty
    else {
      completion(PKPaymentAuthorizationResult(status: .failure, errors: nil))
      continuation?.resume(throwing: ApplePayNativeError.invalidToken)
      continuation = nil
      return
    }

    completion(PKPaymentAuthorizationResult(status: .success, errors: nil))
    continuation?.resume(returning: ["paymentDataJson": tokenJson])
    continuation = nil
  }
}

public class ApplePayModule: Module {
  private var session: ApplePaySession?

  public func definition() -> ModuleDefinition {
    Name("ApplePay")

    AsyncFunction("canMakePayments") { () -> Bool in
      PKPaymentAuthorizationController.canMakePayments(usingNetworks: [.visa, .masterCard])
    }

    AsyncFunction("requestPayment") { (options: [String: String]) -> [String: Any] in
      guard let merchantIdentifier = options["merchantIdentifier"], !merchantIdentifier.isEmpty,
            let merchantName = options["merchantName"], !merchantName.isEmpty,
            let countryCode = options["countryCode"],
            let currencyCode = options["currencyCode"],
            let amount = options["amount"]
      else {
        throw ApplePayNativeError.unavailable
      }

      let request = PKPaymentRequest()
      request.merchantIdentifier = merchantIdentifier
      request.merchantCapabilities = .capability3DS
      request.countryCode = countryCode
      request.currencyCode = currencyCode
      request.supportedNetworks = [.visa, .masterCard]
      request.paymentSummaryItems = [
        PKPaymentSummaryItem(label: merchantName, amount: NSDecimalNumber(string: amount)),
      ]

      let session = ApplePaySession()
      self.session = session
      let payload = try await session.authorize(request)
      self.session = nil
      return payload
    }
  }
}
