import type { Env } from '@/types';

export async function userLookup(
  env: Env,
  email: string,
): Promise<string | null> {
  try {
    if (!email) {
      console.info('PIC is empty, skipping PIC e-mail resolution');

      return null;
    }

    const response = await fetch('https://slack.com/api/users.lookupByEmail', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.SLACK_BOT_TOKEN}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ email }),
    });

    if (!response.ok) {
      console.error(
        `Cannot find user ${email}. Please check the deployment sheet.`,
      );

      return null;
    }

    const { user } = (await response.json()) as { user: { id: string } };
    return user.id;
  } catch (err) {
    console.error(`Cannot find user ${email} due to ${err}`);

    return null;
  }
}
