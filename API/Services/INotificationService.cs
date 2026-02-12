using System.Threading;
using System.Threading.Tasks;

namespace API.Services;

public interface INotificationService
{
    Task TryCreateForEmailAsync(string email, string title, string message, string? url = null, CancellationToken ct = default);
    Task TryCreateForUserIdAsync(string userId, string title, string message, string? url = null, CancellationToken ct = default);
}
