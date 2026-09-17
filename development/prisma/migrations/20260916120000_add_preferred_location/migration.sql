-- Add the optional approximate location used by the private user profile form.
ALTER TABLE "User"
  ADD COLUMN "preferredLocation" VARCHAR(160);
