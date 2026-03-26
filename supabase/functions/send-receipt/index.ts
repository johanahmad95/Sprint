import { serve } from "https://deno.land/std@0.190.0/http/server.ts"

// This pulls the secret you linked in the terminal
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")

serve(async (req) => {
  // This 'record' contains the new booking data from your database
  const { record } = await req.json()

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: "Bookings <onboarding@resend.dev>", // You can change this once your domain is verified
      to: [record.customer_email],
      subject: `Booking Confirmed at ${record.venue_name}`,
      html: `
        <div style="font-family: sans-serif; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
          <h2 style="color: #10b981;">Booking Confirmed!</h2>
          <p>Hi ${record.customer_name}, your court is ready.</p>
          <hr />
          <p><strong>Venue:</strong> ${record.venue_name}</p>
          <p><strong>Court:</strong> ${record.court_name}</p>
          <p><strong>Date:</strong> ${record.booking_date}</p>
          <p><strong>Time:</strong> ${record.start_time}</p>
          <h3 style="background: #f3f4f6; padding: 10px; display: inline-block;">Total Paid: RM ${record.total_price}</h3>
          <p>See you there!</p>
        </div>
      `,
    }),
  })

  return new Response(JSON.stringify({ done: true }), { status: 200 })
})
