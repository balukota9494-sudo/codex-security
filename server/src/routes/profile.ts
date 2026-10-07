import { Router } from "express";
import multer from "multer";
import crypto from "node:crypto";
import { ProfileUpdate } from "@trustguard/shared";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { sendError, sendSuccess } from "../lib/envelope.js";
import { supabaseAdminClient } from "../lib/supabaseAdmin.js";

export const profileRouter = Router();

const upload = multer({
  limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB
  fileFilter: (_req, file, cb) => {
    if (["image/jpeg", "image/png", "image/webp"].includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPEG, PNG, and WebP images are allowed."));
    }
  },
});

// GET or initialize profile
profileRouter.get("/", requireAuth, async (req, res, next) => {
  try {
    const userClient = req.userClient!;
    const userId = req.user!.id;

    let { data: profile } = await userClient
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (!profile) {
      const { data: newProfile, error } = await userClient
        .from("profiles")
        .insert({
          user_id: userId,
          display_name: (req.user?.user_metadata as any)?.full_name || "TrustGuard User",
          language: "en",
          mode: "standard",
        })
        .select()
        .single();

      if (error) throw error;
      profile = newProfile;
    }

    sendSuccess(res, profile);
  } catch (err) {
    next(err);
  }
});

// Update profile details
profileRouter.patch(
  "/",
  requireAuth,
  validate({ body: ProfileUpdate }),
  async (req, res, next) => {
    try {
      const userClient = req.userClient!;
      const userId = req.user!.id;
      const { displayName, language, mode } = req.body;

      const updateData: Record<string, unknown> = {};
      if (displayName !== undefined) updateData.display_name = displayName;
      if (language !== undefined) updateData.language = language;
      if (mode !== undefined) updateData.mode = mode;

      const { data, error } = await userClient
        .from("profiles")
        .update(updateData)
        .eq("user_id", userId)
        .select()
        .single();

      if (error) throw error;
      sendSuccess(res, data);
    } catch (err) {
      next(err);
    }
  }
);

// Upload and secure avatar
profileRouter.post(
  "/avatar",
  requireAuth,
  upload.single("avatar"),
  async (req, res, next) => {
    try {
      const file = req.file;
      if (!file) {
        return sendError(res, "FILE_REQUIRED", "No avatar image file was provided.", 400);
      }

      // Verify magic bytes
      const buffer = file.buffer;
      const isJpeg = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
      const isPng =
        buffer[0] === 0x89 &&
        buffer[1] === 0x50 &&
        buffer[2] === 0x4e &&
        buffer[3] === 0x47;
      const isWebp =
        buffer.slice(0, 4).toString("ascii") === "RIFF" &&
        buffer.slice(8, 12).toString("ascii") === "WEBP";

      if (!isJpeg && !isPng && !isWebp) {
        return sendError(
          res,
          "INVALID_IMAGE_DATA",
          "File magic bytes do not match an authentic image format.",
          400
        );
      }

      const userId = req.user!.id;
      const ext = isJpeg ? "jpg" : isPng ? "png" : "webp";
      const filename = `${crypto.randomUUID()}.${ext}`;
      const storagePath = `${userId}/${filename}`;

      // Upload to private avatars bucket
      const { error: uploadError } = await supabaseAdminClient.storage
        .from("avatars")
        .upload(storagePath, buffer, {
          contentType: file.mimetype,
          upsert: true,
        });

      if (uploadError) {
        throw uploadError;
      }

      // Update avatar path in profile
      const { data: updatedProfile, error: updateError } = await req.userClient!
        .from("profiles")
        .update({ avatar_path: storagePath })
        .eq("user_id", userId)
        .select()
        .single();

      if (updateError) throw updateError;

      // Create signed URL for display
      const { data: signed } = await supabaseAdminClient.storage
        .from("avatars")
        .createSignedUrl(storagePath, 86400);

      sendSuccess(res, {
        profile: updatedProfile,
        avatarUrl: signed?.signedUrl,
      });
    } catch (err) {
      next(err);
    }
  }
);
