CREATE OR REPLACE FUNCTION prevent_booking_status_history_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'BookingStatusHistory is immutable';
END;
$$;

CREATE TRIGGER booking_status_history_immutable
BEFORE UPDATE OR DELETE ON "BookingStatusHistory"
FOR EACH ROW
EXECUTE FUNCTION prevent_booking_status_history_mutation();
