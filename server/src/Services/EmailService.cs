using MailKit;
using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;
using System.Net;

namespace TaskMatrix.Api.Services;

public class EmailService
{
    private readonly IConfiguration _configuration;

    public EmailService(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public async Task SendPasswordResetEmailAsync(
        string email,
        string fullName,
        string resetLink)
    {
        var senderEmail =
            _configuration["EmailSettings:SenderEmail"];

        var appPassword =
            _configuration["EmailSettings:AppPassword"];

        var senderName =
            _configuration["EmailSettings:SenderName"]
            ?? "TaskMatrix Support";

        if (string.IsNullOrWhiteSpace(senderEmail) ||
            string.IsNullOrWhiteSpace(appPassword))
        {
            throw new InvalidOperationException(
                "Email SMTP configuration is missing."
            );
        }

        var message = new MimeMessage();

        message.From.Add(
            new MailboxAddress(senderName, senderEmail)
        );

        message.To.Add(
            MailboxAddress.Parse(email)
        );

        message.Subject = "Reset your TaskMatrix password";

        var safeName = WebUtility.HtmlEncode(
            string.IsNullOrWhiteSpace(fullName)
                ? "User"
                : fullName
        );

        var safeLink = WebUtility.HtmlEncode(resetLink);

        var bodyBuilder = new BodyBuilder
        {
            HtmlBody = $"""
                <!DOCTYPE html>
                <html>
                <body style="font-family: Arial, sans-serif;
                             color: #333; line-height: 1.6;">

                    <div style="max-width: 600px;
                                margin: auto;
                                padding: 30px;">

                        <h2 style="color: #222;">
                            TaskMatrix
                        </h2>

                        <h3>Password Reset Request</h3>

                        <p>Hello {safeName},</p>

                        <p>
                            We received a request to reset
                            your TaskMatrix account password.
                        </p>

                        <p>
                            Click the button below to create
                            a new password:
                        </p>

                        <p style="margin: 30px 0;">
                            <a href="{safeLink}"
                               style="background: #222;
                                      color: white;
                                      padding: 12px 24px;
                                      text-decoration: none;
                                      border-radius: 8px;">
                                Reset Password
                            </a>
                        </p>

                        <p>
                            This link will expire in 30 minutes.
                        </p>

                        <p>
                            If you did not request a password
                            reset, you can ignore this email.
                        </p>

                        <hr />

                        <p style="font-size: 12px; color: #888;">
                            TaskMatrix Support
                        </p>

                    </div>
                </body>
                </html>
                """,

            TextBody = $"""
                Hello {(string.IsNullOrWhiteSpace(fullName) ? "User" : fullName)},

                We received a request to reset your TaskMatrix password.

                Open this link to reset your password:

                {resetLink}

                This link will expire in 30 minutes.

                If you did not request this, ignore this email.

                TaskMatrix Support
                """
        };

        message.Body = bodyBuilder.ToMessageBody();

        using var client = new SmtpClient();

        await client.ConnectAsync(
            "smtp.gmail.com",
            587,
            SecureSocketOptions.StartTls
        );

        await client.AuthenticateAsync(
            senderEmail,
            appPassword
        );

        await client.SendAsync(message);

        await client.DisconnectAsync(true);
    }
}
