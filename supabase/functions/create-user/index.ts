import { serve } from "https://deno.land/std/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js"

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("OK", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization"
      }
    })
  }

  try {
    const { email, password, full_name, role, semester, program } = await req.json()

    if (!email || !password || !full_name || !role) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { "Access-Control-Allow-Origin": "*" }
      })
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL"),
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
    )

    // Program applies to teachers and students; admins are program-less.
    const resolvedProgram =
      role === "admin"
        ? null
        : program === "BA" || program === "MA"
          ? program
          : "BA"

    // Create user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name, role, program: resolvedProgram }
    })

    if (authError) {
      return new Response(JSON.stringify({ error: authError.message }), {
        status: 500,
        headers: { "Access-Control-Allow-Origin": "*" }
      })
    }

    // Update profile with role/semester/program
    const { error: profileError } = await supabase.from("profiles").update({
      role,
      semester: role === "student" ? semester : null,
      program: resolvedProgram
    }).eq("id", authData.user.id)

    if (profileError) {
      return new Response(JSON.stringify({ error: profileError.message }), {
        status: 500,
        headers: { "Access-Control-Allow-Origin": "*" }
      })
    }

    return new Response(JSON.stringify({ message: "User created successfully" }), {
      status: 200,
      headers: { "Access-Control-Allow-Origin": "*" }
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { "Access-Control-Allow-Origin": "*" }
    })
  }
})
