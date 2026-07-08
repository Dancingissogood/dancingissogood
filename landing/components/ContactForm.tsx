export function ContactForm() {
  return (
    <form className="contact-form">
      <label>
        Name
        <input type="text" name="name" placeholder="Your name" />
      </label>
      <label>
        Email
        <input type="email" name="email" placeholder="you@example.com" />
      </label>
      <label>
        Interest
        <select name="interest" defaultValue="3-day camp pass">
          <option>3-day camp pass</option>
          <option>Private instruction</option>
          <option>Group classes</option>
          <option>Instructor availability</option>
        </select>
      </label>
      <button className="button button-primary" type="button">
        Request the Schedule
      </button>
    </form>
  );
}
