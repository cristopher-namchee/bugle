const bugsSheet = '1ZGlbEKvVqaP4BL2a81sKSHaBJw11cYxkyKQpCPdPV7A';
const aipSheet = '1cs1OThqveeEb0cQPOcjsZGwewc6nuFargQ9DPL0UmqE';

const targetSheet = 'REPORT';

const errorKeyMap = {
  bugs: 'Weekly Bug Report',
  performance: 'GLChat Performance Report',
  aip: 'GL AIP Performance Report',
};

function getBugReport() {
  try {
    const ss = SpreadsheetApp.openById(bugsSheet);
    const sheet = ss.getSheets().find(val => val.getName() === targetSheet);

    if (!sheet) {
      throw new Error(`Sheet ${targetSheet} not found in the spreadsheet.`)
    }

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

    for (const num of [...internalOpen, ...internalClosed, ...externalOpen, ...externalClosed]) {
      if (Number.isNaN(num)) {
        throw new Error(`Encountered invalid non-numeric data of ${num}`);
      }
    }

    const data = { internal: { open: internalOpen, closed: internalClosed }, external: { open: externalOpen, closed: externalClosed } };

    return {
      data,
      error: null,
    };
  } catch (error) {
    return {
      data: null,
      error,
    };
  }
}

function getLLMPerformanceReport() {
  try {
    const ss = SpreadsheetApp.openById(bugsSheet);
    const sheet = ss.getSheets().find(val => val.getName() === targetSheet);

    if (!sheet) {
      throw new Error(`Sheet ${targetSheet} not found in the spreadsheet.`)
    }

    const data = [
      sheet.getRange(27, 11).getValue(),
      sheet.getRange(28, 11).getValue(),
      sheet.getRange(29, 11).getValue(),
      sheet.getRange(30, 11).getValue(),
    ];

    return {
      data,
      error: null,
    }
  } catch (error) {
    return {
      data: null,
      error,
    };
  }
}

function getAIPReport() {
  try {
    const ss = SpreadsheetApp.openById(aipSheet);
    const sheets = ss.getSheets();

    // get the second last sheet
    const sheet = sheets[sheets.length - 2];

    const modelSheet = sheets[sheets.length - 1];
    const model = modelSheet.getRange(modelSheet.getLastRow(), 1).getValue();
    const users = Number(modelSheet.getRange(modelSheet.getLastRow(), 4).getValue());

    const scenario = {};
    for (let idx = 1; idx < sheet.getLastRow(); idx += 10) {
      const scenarioName = sheet.getRange(idx, 1).getValue().toString().split('\n')[1];
      const ttft = sheet.getRange(idx + 7, 3).getValue();
      const target = sheet.getRange(idx + 7, 4).getValue().match(/(\d+s)/)[1];

      scenario[scenarioName] = [ttft, target];
    }

    const data = {
      model,
      users,
      scenario,
    };

    return {
      data,
      error: null,
    };
  } catch (error) {
    return {
      data: null,
      error,
    };
  }
}

function doGet() {
  const self = Session.getEffectiveUser().getEmail();

  try {
    const bugs = getBugReport();
    const performance = getLLMPerformanceReport();
    const aip = getAIPReport();

    const data = {
      bugs,
      performance,
      aip,
    };

    if (bugs.error || performance.error || aip.error) {
      GmailApp.sendEmail(self, '⚠️ [Bugle] Partial Error', '', {
        htmlBody: `
        <div style="font-family: Helvetica, Arial, sans-serif; color: #333; line-height: 1.6;">
          <h2>⚠️ Bugle Encountered Errors</h2>

          <p><b>Bugle</b> has encountered several error(s):</p>

          ${Object.entries(data).map(([key, value]) => {
            if (!value.error) {
              return '';
            }

            return `<h3>${errorKeyMap[key]}</h3>

            <div style="background-color: #f8d7da; border: 1px solid #f5c2c7; padding: 10px 15px; border-radius: 6px; margin: 10px 0;">
              <pre style="margin: 0; font-family: Consolas, monospace; white-space: pre-wrap;">${JSON.stringify(value.error, Object.getOwnPropertyNames(value.error), 2)}</pre>
            </div>`;
          }).join(' ')}

          <hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;">

          <p style="font-size: 13px; color: #666;">
            This is an automated message from <b>Bugle</b>.
          </p>
        </div>`,
      });
    }

    return ContentService
      .createTextOutput(JSON.stringify({ status: 'success', data }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    GmailApp.sendEmail(self, '❌ [Bugle] Error', '', {
      htmlBody: `
        <div style="font-family: Helvetica, Arial, sans-serif; color: #333; line-height: 1.6;">
          <h2>❌ Failed to execute</h2>

          <p><b>Bugle</b> failed to execute due to:</p>

          <div style="background-color: #f8d7da; border: 1px solid #f5c2c7; padding: 10px 15px; border-radius: 6px; margin: 10px 0;">
            <pre style="margin: 0; font-family: Consolas, monospace; white-space: pre-wrap;">${JSON.stringify(err, Object.getOwnPropertyNames(err), 2)}</pre>
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
