import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "../site-header";

export const metadata: Metadata = {
  title: "Coming soon · Artispace",
  description:
    "Artispace is still in the studio. A preview of portfolios, context-first discovery, and introductions to galleries and curators."
};

// Every name and work below is an invented example of how Artispace will be used.
export default function ComingSoonPage() {
  return (
    <div className="soon">
      <SiteHeader />

      <section className="soon-intro">
        <p className="soon-badge">Under construction</p>
        <h1>Still in the studio.</h1>
        <p className="lede">
          Artispace isn&rsquo;t open yet. Here&rsquo;s what we&rsquo;re building, and how
          artists, galleries and curators will use it.
        </p>
        <nav className="soon-jump" aria-label="On this page">
          <a href="#portfolios">01 Portfolios</a>
          <a href="#discover">02 Discover</a>
          <a href="#galleries">03 Galleries &amp; curators</a>
        </nav>
      </section>

      <section className="feature" id="portfolios">
        <div className="feature-text">
          <p className="eyebrow">01 · Portfolios</p>
          <h2>A portfolio you shape yourself.</h2>
          <p>
            Not a grid of thumbnails. Hang your work the way you would in a
            room: in series, at the scale it deserves, with the words you want
            beside it.
          </p>
          <ul>
            <li>Arrange works into series and rooms, in the order they were made or the order they should be seen.</li>
            <li>Write wall labels and studio notes next to each piece: medium, dimensions, process.</li>
            <li>Set the wall colour, type and pace of your space.</li>
            <li>Pin one work to greet visitors first.</li>
          </ul>
        </div>
        <figure className="example">
          <div className="mock mock-room">
            <div className="room-bar">
              <span>Ines Okafor</span>
              <span className="room-tabs">
                <b>Tidewater</b> · Early work · Notes
              </span>
            </div>
            <div className="room-wall">
              <div className="work w-a" />
              <div className="work w-b" />
              <div className="work w-c" />
            </div>
            <div className="room-label">
              <i>Tidewater III</i>, 2025 · Oil on linen, 120 × 90 cm
            </div>
          </div>
          <figcaption>
            <span>Example</span> A painter hangs her series <i>Tidewater</i> as one
            room, with the wall labels she&rsquo;d use in a show.
          </figcaption>
        </figure>
      </section>

      <section className="feature" id="discover">
        <div className="feature-text">
          <p className="eyebrow">02 · Discover</p>
          <h2>Found by context, not popularity.</h2>
          <p>
            No follower counts, no likes, no feed that rewards posting often.
            Work surfaces because of what it is: medium, subject, place,
            period, scale.
          </p>
          <ul>
            <li>Search the way curators think: &ldquo;large textile work about migration, made in the last five years.&rdquo;</li>
            <li>See why each artist appears: which part of their practice matched.</li>
            <li>Follow themes and materials, not just people.</li>
          </ul>
        </div>
        <figure className="example">
          <div className="mock mock-search">
            <div className="search-field">
              textile · migration · large scale · 2020s
            </div>
            <ol className="results">
              <li>
                <div className="thumb t1" />
                <div>
                  <b>Amara Diallo</b>
                  <span>Woven indigo panels, 3 m · Dakar</span>
                  <em>Matches medium, theme, scale</em>
                </div>
              </li>
              <li>
                <div className="thumb t2" />
                <div>
                  <b>Tomasz Wren</b>
                  <span>Quilted maps of border towns · Gdańsk</span>
                  <em>Matches theme, period</em>
                </div>
              </li>
              <li>
                <div className="thumb t3" />
                <div>
                  <b>Lucía Ferrán</b>
                  <span>Embroidered letters, series of 40 · Oaxaca</span>
                  <em>Matches medium, theme</em>
                </div>
              </li>
            </ol>
          </div>
          <figcaption>
            <span>Example</span> A curator researching a group show finds three
            artists she&rsquo;d never have seen ranked by followers.
          </figcaption>
        </figure>
      </section>

      <section className="feature" id="galleries">
        <div className="feature-text">
          <p className="eyebrow">03 · Galleries &amp; curators</p>
          <h2>Introductions, not cold emails.</h2>
          <p>
            Galleries and curators post what they&rsquo;re looking for. Artists
            answer with the series that fits, and both sides see the context
            before anyone says hello.
          </p>
          <ul>
            <li>Open calls for shows, residencies and commissions, matched to your practice.</li>
            <li>Submit a series in one step, since your portfolio is already the application.</li>
            <li>Curators keep shortlists and request studio visits in the same place.</li>
          </ul>
        </div>
        <figure className="example">
          <div className="mock mock-call">
            <p className="call-kind">Open call · Group show</p>
            <p className="call-title">Soft Architecture</p>
            <p className="call-meta">Harbour Room Gallery · Rotterdam · Spring</p>
            <p className="call-body">
              Work that treats cloth, paper or skin as a building material.
              Six artists, one room.
            </p>
            <div className="call-fit">
              <span>Your series <i>Folded Rooms</i> fits 3 of 4 criteria</span>
              <span className="call-btn">Submit series</span>
            </div>
          </div>
          <figcaption>
            <span>Example</span> A gallery posts an open call; a sculptor submits
            the series already hanging in her portfolio.
          </figcaption>
        </figure>
      </section>

      <footer className="soon-footer">
        <p>
          We&rsquo;re opening to artists first. Until then, the painting on the
          front page is always running.
        </p>
        <Link className="btn btn-primary" href="/">
          Back to the painting
        </Link>
      </footer>
    </div>
  );
}
