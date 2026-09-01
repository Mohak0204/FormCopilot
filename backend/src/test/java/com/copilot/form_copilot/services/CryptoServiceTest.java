package com.copilot.form_copilot.services;

import org.junit.jupiter.api.Test;
import java.security.SecureRandom;
import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertEquals;

public class CryptoServiceTest {

    @Test
    public void testAesGcmEncryptionDecryption() throws Exception {
        CryptoService cryptoService = new CryptoService();
        String passphrase = "my-secure-passphrase";

        byte[] salt = new byte[16];
        new SecureRandom().nextBytes(salt);

        byte[] key = cryptoService.deriveKey(passphrase, salt);
        assertEquals(32, key.length); // 256 bits

        String originalMessage = "This is a sensitive document content!";
        byte[] plaintext = originalMessage.getBytes();

        byte[] encrypted = cryptoService.encrypt(plaintext, key);
        byte[] decrypted = cryptoService.decrypt(encrypted, key);

        assertArrayEquals(plaintext, decrypted);
        assertEquals(originalMessage, new String(decrypted));
    }
}
