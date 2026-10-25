using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace TaskMatrix.Api.Hubs;

[Authorize]
public class NotificationHub : Hub
{
    // SignalR tự động đọc ClaimTypes.NameIdentifier từ JWT Token khi kết nối
    public override async Task OnConnectedAsync()
    {
        await base.OnConnectedAsync();
    }
}