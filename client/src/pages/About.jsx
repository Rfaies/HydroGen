function About() {
  return (
    <section className="page-stack about-page">
      <header className="page-heading">
        <div>
          <p className="section-kicker">ABOUT THE PLATFORM</p>
          <h2>HydroGen</h2>
          <p>Water-quality monitoring for registered freshwater environments.</p>
        </div>
      </header>

      <div className="about-grid">
        <article className="content-panel about-intro">
          <p className="section-kicker">PURPOSE</p>
          <h3>Make water measurements easier to review.</h3>
          <p>HydroGen is an IoT-based platform for collecting and reviewing water-quality sensor readings. Users can organize monitoring by water body and inspect measurements recorded by an assigned Glob device.</p>
          <p>The current project is intended for freshwater ponds, lakes, and rivers.</p>
        </article>

        <article className="content-panel">
          <p className="section-kicker">GLOB DEVICE</p>
          <h3>From sensor to stored reading</h3>
          <p>Glob uses an ESP8266-based board to send sensor telemetry over Wi-Fi. The server authenticates the device, validates the submitted values, and stores accepted readings for later retrieval.</p>
        </article>

        <article className="content-panel about-parameters">
          <p className="section-kicker">SUPPORTED MEASUREMENTS</p>
          <ul>
            <li><span>Temperature</span><span>°C</span></li>
            <li><span>pH</span><span>Unitless measurement</span></li>
            <li><span>Salinity</span><span>Output unit not confirmed</span></li>
            <li><span>Ammonia</span><span>TAN-N, mg/L</span></li>
          </ul>
        </article>

        <article className="content-panel">
          <p className="section-kicker">USING HYDROGEN</p>
          <h3>Organize monitoring by water body</h3>
          <p>Each account can manage multiple water bodies. Each water body can be assigned one Glob device. The Water Quality page shows the latest stored reading and historical measurements available for the selected water body.</p>
        </article>
      </div>
    </section>
  )
}

export default About
