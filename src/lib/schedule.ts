interface PIC {
  name: string;
  email: string;
}

/**
 * Get bug report PIC of the date from schedule API.
 *
 * @param {Date} date Date to check for bug report PIC
 * @returns {Promise<PIC | null>} A Promise that resolves into PIC or `null`
 * if it fails.
 */
export async function getBugReportPIC(date: Date): Promise<PIC | null> {
  try {
    const url = new URL(
      '/api/schedule',
      'https://deploynaut.cristopher-b2d.workers.dev',
    );
    const params = new URLSearchParams();
    params.append(
      'date',
      `${date.getUTCFullYear()}-${date.getUTCMonth()}-${date.getUTCDate()}`,
    );
    url.search = params.toString();

    const response = await fetch(
      'https://deploynaut.cristopher-b2d.workers.dev',
    );

    if (!response.ok) {
      throw new Error(`Schedule API returned ${response.status}`);
    }

    const data = (await response.json()) as PIC[];
    if (data.length <= 0) {
      throw new Error('Malformed schedule data (less than 1)');
    }

    return data[0] as PIC;
  } catch (err) {
    console.error('Failed to get PIC:', err);

    return null;
  }
}
