import test from 'node:test';
import assert from 'node:assert/strict';
import { isDisposableEmail } from './disposable-email.ts';

test('Disposable Email Blocker - Legitimate emails must be allowed', () => {
  const allowedEmails = [
    'student@upsamail.edu.gh',
    'lecturer@upsa.edu.gh',
    'john.doe@gmail.com',
    'jane.smith@yahoo.com',
    'alex@outlook.com',
    'developer@hotmail.com',
    'ceo@proton.me',
    'contact@custom-company.co.uk',
    'support@voiceofupsa.com',
  ];

  for (const email of allowedEmails) {
    const result = isDisposableEmail(email);
    assert.strictEqual(
      result.isDisposable,
      false,
      `Expected ${email} to be allowed, but was marked disposable`
    );
  }
});

test('Disposable Email Blocker - Known disposable domains must be blocked', () => {
  const blockedEmails = [
    'test@mailinator.com',
    'temp@10minutemail.com',
    'anon@tempmail.com',
    'anon@temp-mail.org',
    'user@guerrillamail.com',
    'fake@sharklasers.com',
    'throw@yopmail.com',
    'junk@trashmail.com',
    'spam@dispostable.com',
    'bot@getairmail.com',
    'burner@burnermail.io',
    'test@fakeinbox.com',
    'temp@mohmal.com',
    'anon@inboxkitten.com',
    'user@crazymailing.com',
    'temp@throwawaymail.com',
  ];

  for (const email of blockedEmails) {
    const result = isDisposableEmail(email);
    assert.strictEqual(
      result.isDisposable,
      true,
      `Expected ${email} to be blocked as disposable, but was allowed`
    );
    assert.ok(result.reason, `Expected a reason for blocking ${email}`);
  }
});

test('Disposable Email Blocker - Subdomains of disposable providers must be blocked', () => {
  const subdomainEmails = [
    'test@subdomain.mailinator.com',
    'user@corp.guerrillamail.com',
    'temp@vip.yopmail.com',
  ];

  for (const email of subdomainEmails) {
    const result = isDisposableEmail(email);
    assert.strictEqual(
      result.isDisposable,
      true,
      `Expected subdomain ${email} to be blocked as disposable`
    );
  }
});

test('Disposable Email Blocker - Pattern matching on temp mail keywords', () => {
  const patternEmails = [
    'user@free-tempmail-service.xyz',
    'bot@instant-disposable-email.info',
    'anon@mythrowawaymail.site',
  ];

  for (const email of patternEmails) {
    const result = isDisposableEmail(email);
    assert.strictEqual(
      result.isDisposable,
      true,
      `Expected pattern-matched ${email} to be blocked`
    );
  }
});

test('Disposable Email Blocker - Invalid email formats', () => {
  assert.strictEqual(isDisposableEmail('').isDisposable, true);
  assert.strictEqual(isDisposableEmail('notanemail').isDisposable, true);
  assert.strictEqual(isDisposableEmail('@missinguser.com').isDisposable, true);
  assert.strictEqual(isDisposableEmail('missingdomain@').isDisposable, true);
});
