using System;
using System.Threading;
using System.Threading.Tasks;
using API.Entities.OrderAggregate;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Stripe;

namespace API.Services;

public enum StripeReversalKind
{
    None = 0,
    CancelledPaymentIntent = 1,
    Refunded = 2
}

public record StripeReversalResult(bool Succeeded, StripeReversalKind Kind, string? RefundId, string? Error);

public class StripeReversalService(IConfiguration config, ILogger<StripeReversalService> logger)
{
    public async Task<StripeReversalResult> ReverseAsync(Order order, CancellationToken ct = default)
    {
        if (order == null) throw new ArgumentNullException(nameof(order));

        var secretKey = config["StripeSettings:SecretKey"];
        if (string.IsNullOrWhiteSpace(secretKey))
        {
            return new StripeReversalResult(false, StripeReversalKind.None, null, "Stripe secret key não configurada");
        }

        if (string.IsNullOrWhiteSpace(order.PaymentIntentId))
        {
            return new StripeReversalResult(false, StripeReversalKind.None, null, "PaymentIntentId em falta");
        }

        // Idempotency: ensure we don't create multiple refunds for the same order.
        // If a refund already exists, consider it done.
        if (!string.IsNullOrWhiteSpace(order.RefundId))
        {
            return new StripeReversalResult(true, StripeReversalKind.Refunded, order.RefundId, null);
        }

        StripeConfiguration.ApiKey = secretKey;

        PaymentIntent? intent;
        try
        {
            var piService = new PaymentIntentService();
            intent = await piService.GetAsync(order.PaymentIntentId, cancellationToken: ct);
        }
        catch (StripeException ex)
        {
            logger.LogError(ex, "Failed to fetch PaymentIntent {PaymentIntentId} for order {OrderId}", order.PaymentIntentId, order.Id);
            return new StripeReversalResult(false, StripeReversalKind.None, null, "Não foi possível obter o pagamento no Stripe");
        }

        if (intent == null)
        {
            return new StripeReversalResult(false, StripeReversalKind.None, null, "Pagamento não encontrado no Stripe");
        }

        // If not succeeded yet, try to cancel the PaymentIntent.
        // Note: once succeeded, it cannot be cancelled; it must be refunded.
        if (!string.Equals(intent.Status, "succeeded", StringComparison.OrdinalIgnoreCase))
        {
            try
            {
                var piService = new PaymentIntentService();
                await piService.CancelAsync(intent.Id, cancellationToken: ct);
                return new StripeReversalResult(true, StripeReversalKind.CancelledPaymentIntent, null, null);
            }
            catch (StripeException ex)
            {
                logger.LogError(ex, "Failed to cancel PaymentIntent {PaymentIntentId} for order {OrderId}", intent.Id, order.Id);
                return new StripeReversalResult(false, StripeReversalKind.None, null, "Não foi possível cancelar o pagamento no Stripe");
            }
        }

        // Create a full refund.
        try
        {
            var refundService = new RefundService();
            var options = new RefundCreateOptions
            {
                PaymentIntent = intent.Id,
                Reason = "requested_by_customer",
                Metadata = new System.Collections.Generic.Dictionary<string, string>
                {
                    ["orderId"] = order.Id.ToString()
                }
            };

            var requestOptions = new RequestOptions
            {
                IdempotencyKey = $"order-{order.Id}-refund"
            };

            var refund = await refundService.CreateAsync(options, requestOptions, ct);
            if (refund == null || string.IsNullOrWhiteSpace(refund.Id))
            {
                return new StripeReversalResult(false, StripeReversalKind.None, null, "Erro ao criar devolução no Stripe");
            }

            return new StripeReversalResult(true, StripeReversalKind.Refunded, refund.Id, null);
        }
        catch (StripeException ex)
        {
            logger.LogError(ex, "Failed to create refund for PaymentIntent {PaymentIntentId} (order {OrderId})", intent.Id, order.Id);
            return new StripeReversalResult(false, StripeReversalKind.None, null, "Não foi possível criar a devolução no Stripe");
        }
    }
}
