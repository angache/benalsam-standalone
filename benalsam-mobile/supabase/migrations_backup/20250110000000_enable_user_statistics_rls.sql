-- Enable RLS on user_statistics table
ALTER TABLE "public"."user_statistics" ENABLE ROW LEVEL SECURITY;

-- The policies already exist, we just need to enable RLS
-- CREATE POLICY "Users can insert own statistics" ON "public"."user_statistics" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));
-- CREATE POLICY "Users can update own statistics" ON "public"."user_statistics" FOR UPDATE USING (("auth"."uid"() = "user_id"));
-- CREATE POLICY "Users can view own statistics" ON "public"."user_statistics" FOR SELECT USING (("auth"."uid"() = "user_id")); 