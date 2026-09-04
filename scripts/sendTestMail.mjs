import fetch from 'node-fetch';

async function sendTest() {
  const recipientEmail = 'sashankraviraj@gmail.com';
  const recipientName = 'Sashank Raviraj';
  const daysSince = 7;
  const assessmentUrl = 'https://biomed-rho.vercel.app/tests';

  const emailHtml = `
<div style="max-width: 560px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.05);">
  <!-- Brand Header -->
  <div style="background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%); padding: 28px 24px; text-align: center;">
    <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">VyomFlow</h1>
    <p style="color: #bae6fd; margin: 6px 0 0 0; font-size: 13px; font-weight: 500;">Cognitive Wellness & Biomarker Intelligence</p>
  </div>

  <div style="padding: 28px 24px; color: #334155; line-height: 1.6;">
    <h2 style="font-size: 18px; color: #0f172a; margin: 0 0 10px 0; font-weight: 600;">Hello ${recipientName},</h2>
    <p style="font-size: 14px; color: #475569; margin: 0 0 20px 0;">
      It has been <strong>${daysSince} days</strong> since your last cognitive assessment. Consistent weekly check-ins provide the clearest picture of your cognitive trend baselines.
    </p>

    <!-- [RECOMMENDATION 2] Personalized Cognitive Snapshot Metric Card -->
    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-left: 4px solid #0284c7; border-radius: 10px; padding: 16px 18px; margin-bottom: 24px;">
      <div style="font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; color: #0284c7; margin-bottom: 10px;">
        📊 Assessment Status Overview
      </div>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 5px 0; font-size: 13px; color: #64748b;">Last Completed:</td>
          <td style="padding: 5px 0; font-size: 13px; font-weight: 600; color: #0f172a; text-align: right;">${daysSince} days ago</td>
        </tr>
        <tr>
          <td style="padding: 5px 0; font-size: 13px; color: #64748b;">Time Commitment:</td>
          <td style="padding: 5px 0; font-size: 13px; font-weight: 600; color: #059669; text-align: right;">⏱️ ~3 Minutes</td>
        </tr>
        <tr>
          <td style="padding: 5px 0; font-size: 13px; color: #64748b;">Included Modules:</td>
          <td style="padding: 5px 0; font-size: 13px; font-weight: 600; color: #0f172a; text-align: right;">Memory • Speed • Fluency</td>
        </tr>
        <tr>
          <td style="padding: 5px 0; font-size: 13px; color: #64748b;">Supported Languages:</td>
          <td style="padding: 5px 0; font-size: 13px; font-weight: 600; color: #0284c7; text-align: right;">11 Indic Languages</td>
        </tr>
      </table>
    </div>

    <!-- [RECOMMENDATION 1] High-Contrast Thumb-Friendly Primary CTA Button -->
    <div style="text-align: center; margin: 28px 0 20px 0;">
      <a href="${assessmentUrl}" target="_blank" rel="noopener noreferrer" style="display: inline-block; background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%); color: #ffffff; font-size: 15px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 8px; box-shadow: 0 4px 14px rgba(2, 132, 199, 0.35); text-align: center;">
        Start 3-Minute Assessment →
      </a>
      <div style="margin-top: 8px; font-size: 12px; color: #94a3b8;">
        No preparation needed • Works seamlessly on mobile & desktop
      </div>
    </div>
  </div>

  <!-- Trust & Privacy Footer -->
  <div style="background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px 20px; text-align: center; font-size: 11px; color: #64748b; line-height: 1.5;">
    <p style="margin: 0 0 4px 0;">🔒 <strong>Privacy Assurance:</strong> Raw audio is ephemeral and never permanently stored.</p>
    <p style="margin: 0;">VyomFlow is a non-diagnostic wellness tool for cognitive trend awareness.</p>
  </div>
</div>
`.trim();

  const payload = {
    service_id: 'service_h2o446q',
    template_id: 'template_j0q8pf8',
    user_id: 'luBlcvWrH7GFbqI0y',
    template_params: {
      to_name: recipientName,
      name: recipientName,
      user_name: recipientName,
      to_email: recipientEmail,
      email: recipientEmail,
      user_email: recipientEmail,
      reply_to: recipientEmail,

      from_name: 'VyomFlow',
      app_name: 'VyomFlow',
      company_name: 'VyomFlow',
      project_name: 'VyomFlow',
      service_name: 'VyomFlow',
      platform_name: 'VyomFlow',
      subject: 'VyomFlow - Cognitive Assessment Reminder',
      title: 'VyomFlow Cognitive Health Reminder',

      cta_text: 'Start 3-Minute Assessment →',
      cta_url: assessmentUrl,
      cta_button: `<a href="${assessmentUrl}" style="display:inline-block;background:#0284c7;color:#fff;padding:14px 28px;border-radius:8px;font-weight:600;text-decoration:none;">Start 3-Minute Assessment →</a>`,
      assessment_link: assessmentUrl,
      action_url: assessmentUrl,
      link: assessmentUrl,

      days_since: daysSince,
      daysSinceLastAssessment: daysSince,
      time_estimate: '~3 Minutes',
      modules_included: 'Memory • Reaction Speed • Language Fluency',
      status_card: `Last Completed: ${daysSince} days ago | Time Required: ~3 mins | Modules: Memory, Reaction Speed, Language Fluency`,

      message: `Hello ${recipientName},\n\nIt has been ${daysSince} days since your last cognitive assessment.\n\n📊 Assessment Snapshot:\n• Last Completed: ${daysSince} days ago\n• Time Required: ~3 Minutes\n• Modules: Memory, Reaction Speed, Language Fluency\n\nStart your 3-minute assessment here:\n${assessmentUrl}\n\nVyomFlow Cognitive Wellness Team`,
      message_html: emailHtml,
      html_body: emailHtml,
      content: emailHtml,
    }
  };

  const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Origin': 'https://biomed-rho.vercel.app'
    },
    body: JSON.stringify(payload)
  });

  const bodyText = await response.text();
  console.log('HTTP Status:', response.status);
  console.log('Response Body:', bodyText);
  if (response.status === 200) {
    console.log('SUCCESS: Email sent successfully to', recipientEmail);
  } else {
    console.error('ERROR: Failed to send email');
  }
}

sendTest().catch(console.error);
