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
  return null;
}

function doGet() {
  try {
    const ss = SpreadsheetApp.openById(bugsSheet);
    const sheet = ss.getSheets()[4];

    const bugs = getBugReport(sheet);

    return ContentService
      .createTextOutput(JSON.stringify({ status: 'success', data: bugs }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    const self = Session.getActiveUser().getEmail();

    GmailApp.sendEmail(self, '🚨 [Bugle] Failed to Execute Script', '', {
      htmlBody: `
        <div style="font-family: Helvetica, Arial, sans-serif; color: #333; line-height: 1.6;">
          <h2>🚨 Failed to read PIC Data</h2>

          <p><b>Deploynaut</b> failed to read PIC's email. Possible causes are:</p>

          <ul>
            <li>PIC names are not defined inside a <a href="https://support.google.com/docs/answer/12319513?hl=en">smart chip</a></li>
            <li>The PIC names are invalid</li>
            <li>The data hasn't been filled yet</li>
          </ul>

          <p>Please do a manual check to the <a href="https://docs.google.com/spreadsheets/d/${shiftSheet}">deployment shift sheet</a>.</p>

          <hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;">

          <p style="font-size: 13px; color: #666;">
            This is an automated message from <b>Deploynaut</b>.
          </p>
        </div>`,
    });

    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: `Script failed to execute due to: ${err.message}` }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
