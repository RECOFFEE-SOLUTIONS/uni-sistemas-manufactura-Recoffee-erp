namespace backend.DTOs;

public record CreateUserRequest(
    string Username,
    string Email,
    string? FullName,
    string Role,
    List<string>? AllowedModules
);

public record UpdateUserPermissionsRequest(
    List<string> AllowedModules
);

public record UserSummaryDto(
    string Id,
    string Username,
    string Email,
    string? FullName,
    IList<string> Roles,
    bool MustChangePassword,
    List<string> AllowedModules
);

public record AccessLogDto(
    int Id,
    DateTime Timestamp,
    string IpAddress,
    string Username,
    bool Success,
    string? FailureReason,
    string? UserAgent
);

public record ForgotPasswordRequest(
    string EmailOrUsername
);

public record ForgotPasswordResponse(
    string Message,
    string? TemporaryPassword,
    string? ResetToken
);

public record ChangePasswordRequest(
    string? CurrentPassword,
    string NewPassword,
    string? ResetToken
);

public class UpdateUserProfileRequest
{
    public string? FullName { get; set; }
    public string? CurrentPassword { get; set; }
    public string? NewPassword { get; set; }
    public string? Username { get; set; }
}
