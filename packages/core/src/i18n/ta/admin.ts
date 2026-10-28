/**
 * Tamil for the Admin area (clinic owner), its form messages and the order notes it adds.
 * Terms follow the rest of the site: மையம் (clinic), பிரிவு (batch), பாடநெறி (course),
 * UPI குறிப்பு எண் (UPI reference).
 */
export const admin: Record<string, string> = {
  // Frame and navigation
  "Admin area": "நிர்வாகப் பகுதி",
  "Clinic dashboard": "மைய நிர்வாகப் பலகை",
  "Signed in as {name}": "{name} ஆக உள்நுழைந்துள்ளீர்கள்",
  "{count} to check": "சரிபார்க்க {count}",
  "View the website": "இணையதளத்தைப் பார்க்க",
  Products: "பொருட்கள்",
  "The Admin area is for the clinic owner": "நிர்வாகப் பகுதி மைய உரிமையாளருக்கு மட்டும்",
  "You're signed in as a customer, so there's nothing to manage here.":
    "நீங்கள் வாடிக்கையாளராக உள்நுழைந்துள்ளீர்கள்; இங்கே நிர்வகிக்க எதுவும் இல்லை.",
  "Go to my account": "என் கணக்குக்குச் செல்",

  // Overview
  "Payments to check": "சரிபார்க்க வேண்டிய கட்டணங்கள்",
  "UPI references customers have sent": "வாடிக்கையாளர்கள் அனுப்பிய UPI குறிப்பு எண்கள்",
  "Orders to prepare": "தயார்செய்ய வேண்டிய ஆர்டர்கள்",
  "Paid orders to pack, ship or hand over": "பொதியிட, அனுப்ப அல்லது ஒப்படைக்க வேண்டிய கட்டணம் செலுத்திய ஆர்டர்கள்",
  "Live class batches not started yet": "இன்னும் தொடங்காத நேரலை வகுப்புப் பிரிவுகள்",
  "Low on stock": "கையிருப்பு குறைவு",
  "Products with 5 or fewer left": "5 அல்லது அதற்குக் குறைவாக மீதமுள்ள பொருட்கள்",
  "Open payments": "கட்டணங்களைத் திற",
  "All caught up": "அனைத்தும் சரிபார்க்கப்பட்டன",
  "No UPI payments are waiting to be checked.": "சரிபார்க்கக் காத்திருக்கும் UPI கட்டணங்கள் எதுவும் இல்லை.",
  "Sent {date}": "அனுப்பியது: {date}",
  Check: "சரிபார்",
  "Add something new": "புதிதாகச் சேர்க்க",
  "New live class": "புதிய நேரலை வகுப்பு",
  "New product": "புதிய பொருள்",
  "New course": "புதிய பாடநெறி",

  // Payments
  "Check each UPI reference against the clinic's bank statement before you verify it. Never verify from a screenshot alone.":
    "சரிபார்ப்பதற்கு முன், ஒவ்வொரு UPI குறிப்பு எண்ணையும் மையத்தின் வங்கி அறிக்கையுடன் ஒப்பிட்டுப் பாருங்கள். திரைப்பிடிப்பை (screenshot) மட்டும் வைத்து ஒருபோதும் சரிபார்க்க வேண்டாம்.",
  "To check": "சரிபார்க்க வேண்டியவை",
  "No payments here": "இங்கே கட்டணங்கள் எதுவும் இல்லை",
  "UPI reference": "UPI குறிப்பு எண்",
  "Paid by {name}": "செலுத்தியவர்: {name}",
  "Not found": "கிடைக்கவில்லை",
  "Verify this payment?": "இந்தக் கட்டணத்தைச் சரிபார்க்கவா?",
  "Open the clinic's bank statement and look for {amount} with this UPI reference:":
    "மையத்தின் வங்கி அறிக்கையைத் திறந்து, இந்த UPI குறிப்பு எண்ணுடன் {amount} வந்துள்ளதா எனப் பாருங்கள்:",
  "Paid by {name} for {what}.": "{what} — செலுத்தியவர்: {name}.",
  "I found this payment in the clinic's bank statement": "இந்தக் கட்டணத்தை மையத்தின் வங்கி அறிக்கையில் கண்டேன்",
  "Verify payment": "கட்டணத்தைச் சரிபார்",
  "Not now": "இப்போது வேண்டாம்",
  "Payment not found?": "கட்டணம் கிடைக்கவில்லையா?",
  "The customer will see your reason and can send the correct UPI reference again. Their order or seat stays reserved for another 24 hours.":
    "நீங்கள் எழுதும் காரணத்தை வாடிக்கையாளர் பார்ப்பார்; சரியான UPI குறிப்பு எண்ணை மீண்டும் அனுப்பலாம். அவருடைய ஆர்டர் அல்லது இடம் மேலும் 24 மணி நேரம் ஒதுக்கப்பட்டிருக்கும்.",
  "Reason for the customer": "வாடிக்கையாளருக்கான காரணம்",
  "For example: We couldn't find this reference. Please check the 12-digit number in your UPI app.":
    "எடுத்துக்காட்டு: இந்தக் குறிப்பு எண் கிடைக்கவில்லை. உங்கள் UPI செயலியில் உள்ள 12 இலக்க எண்ணைச் சரிபாருங்கள்.",
  "Mark as not verified": "சரிபார்க்கப்படவில்லை எனக் குறி",
  "The customer has been asked to check their payment": "கட்டணத்தைச் சரிபார்க்கும்படி வாடிக்கையாளரிடம் கேட்கப்பட்டது",

  // Orders
  "Paid — ready to pack": "கட்டணம் செலுத்தப்பட்டது — பொதியிடத் தயார்",
  "No orders here": "இங்கே ஆர்டர்கள் எதுவும் இல்லை",
  "Try another filter.": "வேறு வடிகட்டியைத் தேர்ந்தெடுங்கள்.",
  "Orders from the shop will appear here.": "கடையில் வரும் ஆர்டர்கள் இங்கே தோன்றும்.",
  "Payment: {status}": "கட்டணம்: {status}",
  "Check the payment": "கட்டணத்தைச் சரிபார்",
  "The customer has sent their UPI reference. Verify the payment before packing this order.":
    "வாடிக்கையாளர் UPI குறிப்பு எண்ணை அனுப்பியுள்ளார். இந்த ஆர்டரைப் பொதியிடுவதற்கு முன் கட்டணத்தைச் சரிபாருங்கள்.",
  Customer: "வாடிக்கையாளர்",
  Items: "பொருட்கள்",
  "Customer's note": "வாடிக்கையாளரின் குறிப்பு",
  "Order progress": "ஆர்டர் நிலை",
  "Order updated": "ஆர்டர் புதுப்பிக்கப்பட்டது",
  "Update order": "ஆர்டரைப் புதுப்பி",
  "Start packing": "பொதியிடத் தொடங்கு",
  "Mark as shipped": "அனுப்பப்பட்டதாகக் குறி",
  "Mark as completed": "நிறைவடைந்ததாகக் குறி",
  "Cancel order": "ஆர்டரை ரத்துசெய்",
  "Courier and tracking number": "கூரியர் பெயரும் கண்காணிப்பு எண்ணும்",
  "The customer sees this on their order.": "இதை வாடிக்கையாளர் தம் ஆர்டரில் பார்ப்பார்.",
  "Note for the customer": "வாடிக்கையாளருக்கான குறிப்பு",
  "This order is paid. The website doesn't send refunds — please refund {amount} to the customer from the clinic's bank account.":
    "இந்த ஆர்டருக்குக் கட்டணம் செலுத்தப்பட்டுள்ளது. இணையதளம் பணத்தைத் திருப்பி அனுப்பாது — மையத்தின் வங்கிக் கணக்கிலிருந்து {amount}-ஐ வாடிக்கையாளருக்குத் திருப்பி அனுப்புங்கள்.",
  "The items go back into stock and the customer can't pay for this order any more.":
    "பொருட்கள் மீண்டும் கையிருப்பில் சேர்க்கப்படும்; இனி இந்த ஆர்டருக்கு வாடிக்கையாளர் கட்டணம் செலுத்த முடியாது.",
  // Order notes the clinic adds (shown to the customer)
  "Your order is being packed": "உங்கள் ஆர்டர் பொதியிடப்படுகிறது",
  "Your order has been shipped": "உங்கள் ஆர்டர் அனுப்பப்பட்டது",
  "Your order is ready to collect at the clinic": "உங்கள் ஆர்டரை மையத்தில் பெற்றுக்கொள்ளலாம்",
  "Order completed": "ஆர்டர் நிறைவடைந்தது",
  "Order cancelled by the clinic": "மையத்தால் ஆர்டர் ரத்துசெய்யப்பட்டது",

  // Shared form bits
  "{label} in Tamil": "{label} (தமிழில்)",
  "Tamil visitors see the English text when this is empty.":
    "இது காலியாக இருந்தால், தமிழ் வாசகர்களுக்கு ஆங்கில உரை காட்டப்படும்.",
  "On the website": "இணையதளத்தில் உள்ளது",
  Hidden: "மறைக்கப்பட்டது",
  "Changes saved": "மாற்றங்கள் சேமிக்கப்பட்டன",
  "See it on the website": "இணையதளத்தில் பார்க்க",
  Title: "தலைப்பு",
  Summary: "சுருக்கம்",
  Description: "விவரம்",
  "Keep it": "வைத்திரு",

  // Live classes
  "Add a class": "வகுப்பைச் சேர்",
  "No classes yet": "இன்னும் வகுப்புகள் இல்லை",
  "Add a class, then add batches with dates and the Google Meet link.":
    "முதலில் வகுப்பைச் சேர்த்து, பிறகு தேதிகளும் Google Meet இணைப்பும் கொண்ட பிரிவுகளைச் சேருங்கள்.",
  "Next batch {date}": "அடுத்த பிரிவு: {date}",
  "No upcoming batch": "வரவிருக்கும் பிரிவு இல்லை",
  "{count} batches": "{count} பிரிவுகள்",
  "{count} confirmed students": "உறுதியான மாணவர்கள்: {count}",
  "All live classes": "அனைத்து நேரலை வகுப்புகளும்",
  "Class added. Now add its first batch.": "வகுப்பு சேர்க்கப்பட்டது. இப்போது அதன் முதல் பிரிவைச் சேருங்கள்.",
  "One or two sentences shown on the class list.": "வகுப்புப் பட்டியலில் காட்டப்படும் ஓரிரு வாக்கியங்கள்.",
  "Shown on the class page. You can use **bold** and lists starting with -.":
    "வகுப்புப் பக்கத்தில் காட்டப்படும். **தடித்த எழுத்து**, - என்று தொடங்கும் பட்டியல்களைப் பயன்படுத்தலாம்.",
  Teacher: "ஆசிரியர்",
  "Language of the class": "வகுப்பு நடைபெறும் மொழி",
  "How the fee is charged": "கட்டணம் வசூலிக்கப்படும் முறை",
  "Fee (₹)": "கட்டணம் (₹)",
  "One amount for the whole batch. Enter 0 for a free class.":
    "பிரிவு முழுவதற்கும் ஒரே தொகை. இலவச வகுப்புக்கு 0 என உள்ளிடுங்கள்.",
  "Charged every month; students renew by paying again. Enter 0 for a free class.":
    "மாதந்தோறும் வசூலிக்கப்படும்; மாணவர்கள் மீண்டும் செலுத்திப் புதுப்பிப்பார்கள். இலவச வகுப்புக்கு 0 என உள்ளிடுங்கள்.",
  "Charged per session; a batch costs this × its number of sessions. Enter 0 for a free class.":
    "ஒவ்வொரு அமர்வுக்கும் வசூலிக்கப்படும்; பிரிவின் மொத்தக் கட்டணம் = இந்தத் தொகை × அமர்வுகளின் எண்ணிக்கை. இலவச வகுப்புக்கு 0 என உள்ளிடுங்கள்.",
  "Show this class on the website": "இந்த வகுப்பை இணையதளத்தில் காட்டு",
  "Hidden classes stay open to students who already registered.":
    "மறைக்கப்பட்ட வகுப்புகள், ஏற்கெனவே பதிவுசெய்த மாணவர்களுக்குத் தொடர்ந்து கிடைக்கும்.",
  "Add class": "வகுப்பைச் சேர்",
  Batches: "பிரிவுகள்",
  "No batches yet. Add one so customers can register.":
    "இன்னும் பிரிவுகள் இல்லை. வாடிக்கையாளர்கள் பதிவுசெய்ய ஒரு பிரிவைச் சேருங்கள்.",
  "Add a batch": "பிரிவைச் சேர்",
  "Edit batch": "பிரிவைத் திருத்து",
  "Save batch": "பிரிவைச் சேமி",
  "Add batch": "பிரிவைச் சேர்",
  "Batch added": "பிரிவு சேர்க்கப்பட்டது",
  "Batch updated": "பிரிவு புதுப்பிக்கப்பட்டது",
  "Batch name": "பிரிவின் பெயர்",
  "For example: Morning batch, or November batch.": "எடுத்துக்காட்டு: காலைப் பிரிவு, அல்லது நவம்பர் பிரிவு.",
  "First session date": "முதல் அமர்வின் தேதி",
  "Start time (India time)": "தொடங்கும் நேரம் (இந்திய நேரம்)",
  "Minutes per session": "ஓர் அமர்வின் நேரம் (நிமிடங்கள்)",
  "Up to 60, the free Google Meet limit.": "அதிகபட்சம் 60 — இலவச Google Meet வரம்பு.",
  "Sessions each month": "மாதத்துக்கு அமர்வுகள்",
  "Number of sessions": "அமர்வுகளின் எண்ணிக்கை",
  "Days and times": "நாட்களும் நேரங்களும்",
  "For example: Mon, Wed, Fri · 7:00–7:45 AM": "எடுத்துக்காட்டு: திங்கள், புதன், வெள்ளி · காலை 7:00–7:45",
  "Seat limit": "இட வரம்பு",
  "Leave empty for no limit.": "வரம்பு வேண்டாமெனில் காலியாக விடுங்கள்.",
  "Google Meet link": "Google Meet இணைப்பு",
  "Only students whose payment you have verified see this link. Starts with meet.google.com/":
    "நீங்கள் கட்டணத்தைச் சரிபார்த்த மாணவர்கள் மட்டுமே இந்த இணைப்பைப் பார்ப்பார்கள். meet.google.com/ என்று தொடங்கும்",
  "Open for registration": "பதிவுக்குத் திறந்துள்ளது",
  "Registration open": "பதிவு திறந்துள்ளது",
  "Meet link added": "Meet இணைப்பு சேர்க்கப்பட்டது",
  "No Meet link yet": "இன்னும் Meet இணைப்பு இல்லை",
  "{count} sessions": "{count} அமர்வுகள்",
  "{minutes} min each": "ஒவ்வொன்றும் {minutes} நிமிடம்",
  "{count} registered · no seat limit": "{count} பேர் பதிவு · இட வரம்பு இல்லை",
  "{count} of {limit} seats taken": "{limit} இடங்களில் {count} நிரம்பின",
  "Registration fee {amount}": "பதிவுக் கட்டணம் {amount}",
  "{count} confirmed students are waiting for the Google Meet link.":
    "உறுதியான {count} மாணவர்கள் Google Meet இணைப்புக்காகக் காத்திருக்கிறார்கள்.",
  "Students ({count})": "மாணவர்கள் ({count})",
  "Delete this batch?": "இந்தப் பிரிவை நீக்கவா?",
  "Delete batch": "பிரிவை நீக்கு",
  "Batch deleted": "பிரிவு நீக்கப்பட்டது",
  "Your seat is confirmed": "உங்கள் இடம் உறுதியானது",
  "The clinic will add the Google Meet link here before the class starts.":
    "வகுப்பு தொடங்கும் முன் மையம் Google Meet இணைப்பை இங்கே சேர்க்கும்.",

  // Products
  "Add a product": "பொருளைச் சேர்",
  "No products yet": "இன்னும் பொருட்கள் இல்லை",
  "{count} left": "{count} மீதம்",
  "{count} in stock": "கையிருப்பில் {count}",
  "Product details": "பொருள் விவரங்கள்",
  "Product added": "பொருள் சேர்க்கப்பட்டது",
  "Product name": "பொருளின் பெயர்",
  Category: "வகை",
  "No category": "வகை இல்லை",
  Size: "அளவு",
  "For example: 100 g or 200 ml": "எடுத்துக்காட்டு: 100 கி அல்லது 200 மி.லி.",
  "Price (₹)": "விலை (₹)",
  "MRP (₹)": "MRP (₹)",
  "Shown crossed out when higher than the price.": "விலையைவிட அதிகமாக இருந்தால், அடித்துக் காட்டப்படும்.",
  Stock: "கையிருப்பு",
  "How many you have to sell now.": "இப்போது விற்பனைக்கு உள்ள எண்ணிக்கை.",
  "Short description": "சுருக்கமான விவரம்",
  "One line shown on the shop page.": "கடைப் பக்கத்தில் காட்டப்படும் ஒரு வரி.",
  "Shown on the product page. You can use **bold** and lists starting with -.":
    "பொருள் பக்கத்தில் காட்டப்படும். **தடித்த எழுத்து**, - என்று தொடங்கும் பட்டியல்களைப் பயன்படுத்தலாம்.",
  "Feature this product at the top of the shop": "இந்தப் பொருளைக் கடையின் மேற்பகுதியில் சிறப்பாகக் காட்டு",
  "Show this product in the shop": "இந்தப் பொருளைக் கடையில் காட்டு",
  "Hidden products can't be ordered; past orders are not affected.":
    "மறைக்கப்பட்ட பொருட்களை ஆர்டர் செய்ய இயலாது; முந்தைய ஆர்டர்கள் பாதிக்கப்படாது.",
  "Add product": "பொருளைச் சேர்",

  // Courses
  "Add a course": "பாடநெறியைச் சேர்",
  "{count} active students": "செயலில் உள்ள மாணவர்கள்: {count}",
  "Course details": "பாடநெறி விவரங்கள்",
  "Course added. Now add its lessons.": "பாடநெறி சேர்க்கப்பட்டது. இப்போது அதன் பாடங்களைச் சேருங்கள்.",
  "One or two sentences shown on the course list.": "பாடநெறிப் பட்டியலில் காட்டப்படும் ஓரிரு வாக்கியங்கள்.",
  "Shown on the course page. You can use **bold** and lists starting with -.":
    "பாடநெறிப் பக்கத்தில் காட்டப்படும். **தடித்த எழுத்து**, - என்று தொடங்கும் பட்டியல்களைப் பயன்படுத்தலாம்.",
  "Enter 0 for a free course.": "இலவசப் பாடநெறிக்கு 0 என உள்ளிடுங்கள்.",
  "Access (days)": "அணுகல் காலம் (நாட்கள்)",
  "How long students can watch after payment. 365 = 12 months. Leave empty for lifetime.":
    "கட்டணத்துக்குப் பிறகு மாணவர்கள் எத்தனை நாட்கள் பார்க்கலாம். 365 = 12 மாதங்கள். வாழ்நாள் அணுகலுக்குக் காலியாக விடுங்கள்.",
  "Show this course on the website": "இந்தப் பாடநெறியை இணையதளத்தில் காட்டு",
  "Hidden courses stay open to students who already enrolled.":
    "மறைக்கப்பட்ட பாடநெறிகள், ஏற்கெனவே சேர்ந்த மாணவர்களுக்குத் தொடர்ந்து கிடைக்கும்.",
  "Add course": "பாடநெறியைச் சேர்",
  "No lessons yet.": "இன்னும் பாடங்கள் இல்லை.",
  "Add a lesson": "பாடத்தைச் சேர்",
  "Edit lesson": "பாடத்தைத் திருத்து",
  "Save lesson": "பாடத்தைச் சேமி",
  "Add lesson": "பாடத்தைச் சேர்",
  "Lesson added": "பாடம் சேர்க்கப்பட்டது",
  "Lesson updated": "பாடம் புதுப்பிக்கப்பட்டது",
  "Lesson title": "பாடத்தின் தலைப்பு",
  "Video link": "வீடியோ இணைப்பு",
  "A YouTube or Vimeo link. Set the video to Unlisted so only students can find it.":
    "YouTube அல்லது Vimeo இணைப்பு. மாணவர்கள் மட்டும் பார்க்கும்படி, வீடியோவை 'Unlisted' என அமையுங்கள்.",
  "Length (minutes)": "நீளம் (நிமிடங்கள்)",
  "Lesson notes": "பாடக் குறிப்புகள்",
  "Free preview — anyone can watch this lesson": "இலவச முன்னோட்டம் — இந்தப் பாடத்தை யார் வேண்டுமானாலும் பார்க்கலாம்",
  "{minutes} min": "{minutes} நிமிடம்",
  "Video added": "வீடியோ சேர்க்கப்பட்டது",
  "No video yet": "இன்னும் வீடியோ இல்லை",
  "Delete this lesson?": "இந்தப் பாடத்தை நீக்கவா?",
  "Delete lesson": "பாடத்தை நீக்கு",
  "Lesson deleted": "பாடம் நீக்கப்பட்டது",

  // Form messages (validation and server)
  "Enter an amount in rupees, like 1500": "ரூபாயில் தொகையை உள்ளிடுங்கள், எ.கா. 1500",
  "This amount is too large": "இந்தத் தொகை மிக அதிகம்",
  "Enter a price of at least ₹1": "குறைந்தது ₹1 விலையை உள்ளிடுங்கள்",
  "MRP can't be lower than the price": "MRP, விலையைவிடக் குறைவாக இருக்கக் கூடாது",
  "Enter a Google Meet link (meet.google.com/…)": "Google Meet இணைப்பை உள்ளிடுங்கள் (meet.google.com/…)",
  "Paste a YouTube or Vimeo link": "YouTube அல்லது Vimeo இணைப்பை ஒட்டுங்கள்",
  "Choose a level": "நிலையைத் தேர்ந்தெடுங்கள்",
  "Choose how the fee is charged": "கட்டண முறையைத் தேர்ந்தெடுங்கள்",
  "Live sessions can be 15 to 60 minutes": "நேரலை அமர்வு 15 முதல் 60 நிமிடங்கள் வரை இருக்கலாம்",
  "Enter between 1 and 200 sessions": "1 முதல் 200 அமர்வுகளுக்குள் உள்ளிடுங்கள்",
  "Leave empty for no limit, or enter 1 to 1000":
    "வரம்பு வேண்டாமெனில் காலியாக விடுங்கள், அல்லது 1 முதல் 1000 வரை உள்ளிடுங்கள்",
  "Choose a date": "தேதியைத் தேர்ந்தெடுங்கள்",
  "Enter a time, like 18:30": "நேரத்தை உள்ளிடுங்கள், எ.கா. 18:30",
  "Choose a start time in the future": "இனி வரும் ஒரு தொடக்க நேரத்தைத் தேர்ந்தெடுங்கள்",
  "Enter a stock count from 0 to 100000": "0 முதல் 100000 வரை கையிருப்பு எண்ணிக்கையை உள்ளிடுங்கள்",
  "Leave empty for lifetime access, or enter 1 to 3650 days":
    "வாழ்நாள் அணுகலுக்குக் காலியாக விடுங்கள், அல்லது 1 முதல் 3650 நாட்கள் வரை உள்ளிடுங்கள்",
  "Enter minutes from 1 to 600, or leave empty": "1 முதல் 600 நிமிடங்கள் வரை உள்ளிடுங்கள், அல்லது காலியாக விடுங்கள்",
  "Choose what happens next": "அடுத்த படியைத் தேர்ந்தெடுங்கள்",
  "Choose a category": "வகையைத் தேர்ந்தெடுங்கள்",
  "Confirm you found this payment in the bank statement":
    "இந்தக் கட்டணத்தை வங்கி அறிக்கையில் கண்டதை உறுதிப்படுத்துங்கள்",
  "This payment has already been checked. Refresh to see its latest status.":
    "இந்தக் கட்டணம் ஏற்கெனவே சரிபார்க்கப்பட்டது. அதன் தற்போதைய நிலையைப் பார்க்கப் பக்கத்தைப் புதுப்பியுங்கள்.",
  "This order can't be moved to that step now. Refresh to see its latest status.":
    "இந்த ஆர்டரை இப்போது அந்தப் படிக்கு மாற்ற இயலாது. அதன் தற்போதைய நிலையைப் பார்க்கப் பக்கத்தைப் புதுப்பியுங்கள்.",
  "This batch already has students, so it can't be deleted. Close registration instead.":
    "இந்தப் பிரிவில் ஏற்கெனவே மாணவர்கள் உள்ளனர்; எனவே நீக்க இயலாது. அதற்குப் பதிலாகப் பதிவை நிறுத்துங்கள்.",
};
