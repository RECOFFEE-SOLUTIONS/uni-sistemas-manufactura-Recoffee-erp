namespace backend.DTOs;

public record LoginRequest(string Username, string Password);

public record UserDto(string Id, string Username, string Email, IList<string> Roles);

public record LoginResponse(string Token, UserDto User);
