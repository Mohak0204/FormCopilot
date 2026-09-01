package com.copilot.form_copilot.services;

import org.bouncycastle.crypto.generators.Argon2BytesGenerator;
import org.bouncycastle.crypto.params.Argon2Parameters;
import org.springframework.stereotype.Service;

import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.security.SecureRandom;

@Service
public class CryptoService {

    private static final int GCM_IV_LENGTH = 12; // in bytes
    private static final int GCM_TAG_LENGTH = 128; // in bits

    public byte[] deriveKey(String passphrase, byte[] salt) {
        Argon2Parameters.Builder builder = new Argon2Parameters.Builder(Argon2Parameters.ARGON2_id)
                .withVersion(Argon2Parameters.ARGON2_VERSION_13)
                .withIterations(3)
                .withMemoryAsKB(16384)
                .withParallelism(1)
                .withSalt(salt);

        Argon2BytesGenerator gen = new Argon2BytesGenerator();
        gen.init(builder.build());

        byte[] result = new byte[32]; // 256-bit key
        gen.generateBytes(passphrase.toCharArray(), result);
        return result;
    }

    public byte[] encrypt(byte[] plaintext, byte[] key) throws Exception {
        byte[] iv = new byte[GCM_IV_LENGTH];
        new SecureRandom().nextBytes(iv);

        Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
        GCMParameterSpec spec = new GCMParameterSpec(GCM_TAG_LENGTH, iv);
        SecretKeySpec keySpec = new SecretKeySpec(key, "AES");

        cipher.init(Cipher.ENCRYPT_MODE, keySpec, spec);
        byte[] cipherText = cipher.doFinal(plaintext);

        // Output format: IV + cipherText
        byte[] output = new byte[iv.length + cipherText.length];
        System.arraycopy(iv, 0, output, 0, iv.length);
        System.arraycopy(cipherText, 0, output, iv.length, cipherText.length);

        return output;
    }

    public byte[] decrypt(byte[] encryptedData, byte[] key) throws Exception {
        byte[] iv = new byte[GCM_IV_LENGTH];
        System.arraycopy(encryptedData, 0, iv, 0, iv.length);

        byte[] cipherText = new byte[encryptedData.length - GCM_IV_LENGTH];
        System.arraycopy(encryptedData, GCM_IV_LENGTH, cipherText, 0, cipherText.length);

        Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
        GCMParameterSpec spec = new GCMParameterSpec(GCM_TAG_LENGTH, iv);
        SecretKeySpec keySpec = new SecretKeySpec(key, "AES");

        cipher.init(Cipher.DECRYPT_MODE, keySpec, spec);
        return cipher.doFinal(cipherText);
    }
}
