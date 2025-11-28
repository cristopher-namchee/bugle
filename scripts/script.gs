const bugsSheet = '1ZGlbEKvVqaP4BL2a81sKSHaBJw11cYxkyKQpCPdPV7A';

function getBugReport(sheet) {
  const internalOpen = [
    sheet.getRange(5, 2).getValue(), sheet.getRange(6, 2).getValue(), sheet.getRange(7, 2).getValue(),
  ];
  const externalOpen = [
    sheet.getRange(5, 4).getValue(), sheet.getRange(6, 4).getValue(), sheet.getRange(7, 4).getValue(),
  ];
  const internalClosed = [
    sheet.getRange(10, 2).getValue(), sheet.getRange(11, 2).getValue(), sheet.getRange(12, 2).getValue(), sheet.getRange(13, 2).getValue(),
  ];
  const externalClosed = [
    sheet.getRange(10, 4).getValue(), sheet.getRange(11, 4).getValue(), sheet.getRange(12, 4).getValue(), sheet.getRange(13, 4).getValue(),
  ];

  return { internal: { open: internalOpen, closed: internalClosed }, external: { open: externalOpen, closed: externalClosed } };
}

function getPerformanceReport(sheet) {
  return [
    sheet.getRange(27, 11).getValue(),
    sheet.getRange(28, 11).getValue(),
    sheet.getRange(29, 11).getValue(),
    sheet.getRange(30, 11).getValue(),
  ];
}

function doGet() {
  try {
    const ss = SpreadsheetApp.openById(bugsSheet);
    const sheet = ss.getSheets()[4];

    const bugs = getBugReport(sheet);
    const performance = getPerformanceReport(sheet);

    const data = {
      bugs,
      performance,
    };

    return ContentService
      .createTextOutput(JSON.stringify({ status: 'success', data }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    const self = Session.getActiveUser().getEmail();

    GmailApp.sendEmail(self, '🚨 [Bugle] Failed to Execute Script', '', {
      htmlBody: `
        <div style="font-family: Helvetica, Arial, sans-serif; color: #333; line-height: 1.6;">
          <h2>🚨 Failed to execute script</h2>

          <p><b>Bugle</b> failed to execute due to:</p>

          <div style="background-color: #f8d7da; border: 1px solid #f5c2c7; padding: 10px 15px; border-radius: 6px; margin: 10px 0;">
            <pre style="margin: 0; font-family: Consolas, monospace; white-space: pre-wrap;">${err.message}</pre>
          </div>

          <hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;">

          <p style="font-size: 13px; color: #666;">
            This is an automated message from <b>Bugle</b>.
          </p>
        </div>`,
    });

    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: `Script failed to execute due to: ${err.message}` }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
