using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models;

[Table("AccessLogs")]
public class AccessLog
{
    [Key]
    public int Id { get; set; }

    [Required]
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;

    [Required]
    [MaxLength(50)]
    public string IpAddress { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string Username { get; set; } = string.Empty;

    [Required]
    public bool Success { get; set; }

    [MaxLength(200)]
    public string? FailureReason { get; set; }

    [MaxLength(255)]
    public string? UserAgent { get; set; }
}

[Table("UserModulePermissions")]
public class UserModulePermission
{
    [Key]
    public int Id { get; set; }

    [Required]
    [MaxLength(450)]
    public string UserId { get; set; } = string.Empty;

    [Required]
    [MaxLength(50)]
    public string ModuleKey { get; set; } = string.Empty; // e.g., "master-data", "engineering", "transactions", "mes", "iiot", "users"

    [Required]
    public bool CanAccess { get; set; } = true;

    public DateTime GrantedAt { get; set; } = DateTime.UtcNow;
}

[Table("UserSecurityProfiles")]
public class UserSecurityProfile
{
    [Key]
    public int Id { get; set; }

    [Required]
    [MaxLength(450)]
    public string UserId { get; set; } = string.Empty;

    public bool MustChangePassword { get; set; } = false;

    public bool IsTemporaryPassword { get; set; } = false;

    [MaxLength(100)]
    public string? TemporaryPassword { get; set; }

    public DateTime? LastPasswordChangeDate { get; set; }

    [MaxLength(200)]
    public string? ResetToken { get; set; }

    public DateTime? ResetTokenExpiresAt { get; set; }
}
