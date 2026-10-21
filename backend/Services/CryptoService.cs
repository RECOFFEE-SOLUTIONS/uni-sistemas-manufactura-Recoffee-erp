using System.Security.Cryptography;
using System.Text;

namespace backend.Services;

public class CryptoService : ICryptoService
{
    private readonly RSA _rsa;
    private readonly string _publicKeyPem;
    private readonly ILogger<CryptoService> _logger;

    public CryptoService(ILogger<CryptoService> logger)
    {
        _logger = logger;
        // Generate or initialize RSA 2048-bit key pair
        _rsa = RSA.Create(2048);
        _publicKeyPem = _rsa.ExportSubjectPublicKeyInfoPem();
        _logger.LogInformation("RSA 2048-bit CryptoService initialized for payload asymmetric encryption.");
    }

    public string GetPublicKeyPem()
    {
        return _publicKeyPem;
    }

    public string DecryptPassword(string cipherTextBase64)
    {
        if (string.IsNullOrWhiteSpace(cipherTextBase64))
        {
            return cipherTextBase64;
        }

        try
        {
            byte[] cipherBytes = Convert.FromBase64String(cipherTextBase64);
            byte[] decryptedBytes = _rsa.Decrypt(cipherBytes, RSAEncryptionPadding.OaepSHA256);
            return Encoding.UTF8.GetString(decryptedBytes);
        }
        catch (FormatException)
        {
            // Not a base64 string - might be plaintext in dev/seeder tests
            _logger.LogWarning("Input is not a valid Base64 string; falling back to raw value.");
            return cipherTextBase64;
        }
        catch (CryptographicException ex)
        {
            _logger.LogWarning("Asymmetric decryption failed ({Message}); falling back to raw value.", ex.Message);
            return cipherTextBase64;
        }
    }
}
