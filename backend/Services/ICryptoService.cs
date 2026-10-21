namespace backend.Services;

public interface ICryptoService
{
    string GetPublicKeyPem();
    string DecryptPassword(string cipherTextBase64);
}
