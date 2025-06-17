import { KeyboardListener } from "https://esm.sh/@wuxh/utils?exports=KeyboardListener";
import contacts from "https://esm.sh/wxh16144/contact";

const listener = new KeyboardListener();

function handleContactSubmission(contactId, contactInfo) {
  const shouldOpen = confirm(`Open this link: ${contactInfo}?`);
  if (shouldOpen) window.open(contactInfo, '_blank');
}

for (const [contactId, contactInfo] of Object.entries(contacts)) {
  if (typeof contactId === 'string' && contactId.length >= 3) {
    listener.register(contactId, () => handleContactSubmission(contactId, contactInfo));
  };
}

listener.start();