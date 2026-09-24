CREATE OR REPLACE FUNCTION prevent_completed_at_mutation()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.status = 'completed' AND NEW."completedAt" IS DISTINCT FROM OLD."completedAt" THEN
    RAISE EXCEPTION 'Booking.completedAt is immutable after completion';
  END IF;
  RETURN NEW;
END;
$$;