import { serve } from "https://deno.land/std@0.190.0/http/server.ts"

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")

serve(async (req) => {
  try {
    const { record } = await req.json()

    if (!RESEND_API_KEY) {
      console.error("RESEND_API_KEY is not set")
      return new Response(JSON.stringify({ error: "RESEND_API_KEY not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      })
    }

    if (!record?.customer_email) {
      return new Response(JSON.stringify({ error: "Missing customer_email in record" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Sprint Bookings <onboarding@resend.dev>", // Replace with your verified domain once set up
        to: [record.customer_email],
        subject: `Booking Confirmed: ${record.court_name}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
            <h1 style="color: #FF6B35;">Booking Confirmed!</h1>
            <p>Hi <strong>${record.customer_name}</strong>, your session is all set.</p>

            <div style="background: #f9f9f9; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <p style="margin: 4px 0;"><strong>Venue:</strong> ${record.venue_name}</p>
              <p style="margin: 4px 0;"><strong>Court:</strong> ${record.court_name}</p>
              <p style="margin: 4px 0;"><strong>Date:</strong> ${record.booking_date}</p>
              <p style="margin: 4px 0;"><strong>Time:</strong> ${record.start_time}</p>
            </div>

            <h2 style="color: #333;">Total Paid: RM${record.total_price}</h2>

            <p style="color: #666; font-size: 14px;">
              See you on the court! If you need to make any changes, please contact the venue directly.
            </p>

            <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
            <p style="color: #aaa; font-size: 12px;">Sprint – Book Sports Courts in Klang Valley</p>
          </div>
        `,
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      console.error("Resend API error:", data)
      return new Response(JSON.stringify({ error: data }), {
        status: res.status,
        headers: { "Content-Type": "application/json" },
      })
    }

    console.log("Email sent successfully:", data.id)
    return new Response(JSON.stringify({ success: true, id: data.id }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })
  } catch (err) {
    console.error("Unexpected error:", err)
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
})
