<?php
/**
 * The Contact page's form handler (src/components/contact/ContactForm.astro).
 * Copied as-is into dist/ and run by GoDaddy's PHP; nothing else on the site
 * runs server-side.
 *
 * It validates the post, drops spam (a honeypot field and a too-fast submit
 * look like success to the bot, so it learns nothing), and mails the team a
 * plain-text message with Reply-To set to the visitor.
 *
 * Script posts ask for JSON (`Accept: application/json`) and get
 * {"ok": true|false}. A plain form post is redirected: to the thank-you page,
 * or back to the form with `?error=1`.
 *
 * Works on PHP 7.0+.
 */

// ---- Settings -------------------------------------------------------------

/**
 * Who receives each inquiry type. Anything not listed goes to `default`.
 * TODO: confirm the inbox(es), e.g. 'bulk' => 'sales@ceylonfuturebeverages.com'.
 */
$RECIPIENTS = [
    'default' => 'info@ceylonfuturebeverages.com',
];

/**
 * The sender. It must be an address on this domain, or GoDaddy's mail relay
 * (and SPF/DMARC at the receiving end) will reject or junk the message.
 * TODO: create this mailbox or alias in cPanel, or point it at an existing one.
 */
$FROM = 'website@ceylonfuturebeverages.com';

$THANKS = '/contact/thanks/';
$BACK = '/contact/';

/** Submits faster than this (ms after page load) are taken as bots. */
$MIN_FILL_MS = 3000;

$TYPES = [
    'general' => 'General',
    'bulk' => 'Bulk Order',
    'mixed' => 'Mixed Pack Order',
    'distribution' => 'Distribution / Export',
    'feedback' => 'Feedback',
    'media' => 'Media',
];

/**
 * The flavours a bulk order counts cans of, by id. Keep in step with
 * src/content/flavours (the form posts `cans[<id>]`).
 */
$FLAVOURS = [
    'matcha-original' => 'Matcha Original',
    'mango-passion' => 'Mango & Passion',
    'pineapple' => 'Pineapple',
];

// ---- Handler --------------------------------------------------------------

header('Cache-Control: no-store');
header('X-Robots-Tag: noindex');

$wantsJson = isset($_SERVER['HTTP_ACCEPT']) && strpos($_SERVER['HTTP_ACCEPT'], 'application/json') !== false;

function respond($ok, $status, $wantsJson, $redirect)
{
    if ($wantsJson) {
        http_response_code($status);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['ok' => $ok]);
    } else {
        header('Location: ' . $redirect, true, 303);
    }
    exit;
}

/** A trimmed, length-capped single-line value; line breaks are dropped. */
function line($key, $max)
{
    $value = isset($_POST[$key]) && is_string($_POST[$key]) ? $_POST[$key] : '';
    $value = trim(preg_replace('/[\r\n\t]+/', ' ', $value));
    return mb_substr($value, 0, $max, 'UTF-8');
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Allow: POST');
    respond(false, 405, $wantsJson, $BACK);
}

$fail = $BACK . '?error=1#form';

// Spam: the honeypot is filled, or the form came back too fast.
$started = line('t', 20);
if (line('website', 200) !== '' || (ctype_digit($started) && (microtime(true) * 1000 - (float) $started) < $MIN_FILL_MS)) {
    respond(true, 200, $wantsJson, $THANKS);
}

$name = line('name', 100);
$email = line('email', 200);
$phone = line('phone', 40);
$intent = line('intent', 20);
$quantity = line('quantity', 10);
$company = line('company', 150);
$country = line('country', 100);
$topic = line('subject', 150);
// A Mixed Pack's locked order summary: a few lines.
$order = isset($_POST['order']) && is_string($_POST['order'])
    ? mb_substr(trim(str_replace("\r\n", "\n", $_POST['order'])), 0, 1000, 'UTF-8')
    : '';
// A bulk order's cans per flavour: whole numbers, 0 or blank for none.
$cans = [];
$cansValid = true;
$postedCans = isset($_POST['cans']) && is_array($_POST['cans']) ? $_POST['cans'] : [];
foreach ($FLAVOURS as $id => $flavour) {
    $n = isset($postedCans[$id]) && is_string($postedCans[$id]) ? trim($postedCans[$id]) : '';
    if ($n === '' || $n === '0') {
        continue;
    }
    if (!ctype_digit($n) || strlen($n) > 5) {
        $cansValid = false;
        continue;
    }
    $cans[$flavour] = (int) $n;
}
$message = isset($_POST['message']) && is_string($_POST['message'])
    ? mb_substr(trim(str_replace("\r\n", "\n", $_POST['message'])), 0, 5000, 'UTF-8')
    : '';

$valid = $name !== ''
    && filter_var($email, FILTER_VALIDATE_EMAIL)
    && isset($TYPES[$intent])
    && $topic !== ''
    && $message !== ''
    && ($phone === '' || preg_match('/^[0-9+()\-. ]{5,40}$/', $phone))
    && ($quantity === '' || ctype_digit($quantity))
    && $cansValid
    && ($intent !== 'mixed' || $order !== '');

if (!$valid) {
    respond(false, 422, $wantsJson, $fail);
}

// Only the fields of the chosen type are relevant (the form disables the rest).
$rows = [
    'Name' => $name,
    'Email' => $email,
    'Phone' => $phone,
    'Inquiry type' => $TYPES[$intent],
    'Subject' => $topic,
];
if ($intent === 'bulk' && $cans) {
    foreach ($cans as $flavour => $n) {
        $rows[$flavour] = $n . ' cans';
    }
    $rows['Total'] = array_sum($cans) . ' cans';
}
if ($intent === 'distribution') {
    $rows += ['Company' => $company, 'Country / region' => $country];
}

$body = '';
foreach ($rows as $label => $value) {
    if ($value !== '') {
        $body .= str_pad($label . ':', 18) . $value . "\n";
    }
}
if ($intent === 'mixed') {
    $body .= "\nOrder:\n" . $order . "\n";
}
$body .= "\n" . $message . "\n\n--\nSent from the Contact page of ceylonfuturebeverages.com\n";

$to = isset($RECIPIENTS[$intent]) ? $RECIPIENTS[$intent] : $RECIPIENTS['default'];
$subject = '=?UTF-8?B?' . base64_encode($TYPES[$intent] . ': ' . $topic . ' (' . $name . ')') . '?=';
$headers = implode("\r\n", [
    'From: Ceylon Future Beverages website <' . $FROM . '>',
    'Reply-To: ' . $email,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit',
]);

$sent = mail($to, $subject, $body, $headers, '-f' . $FROM);

respond($sent, $sent ? 200 : 500, $wantsJson, $sent ? $THANKS : $fail);
