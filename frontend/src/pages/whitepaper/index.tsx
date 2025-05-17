
import "./index.css"

function Whitepaper() {
  return (
    <>
      <div className="whitepaper-header">
        <h1 className="whitepaper-title">Artist Ownership & Social Engagement Protocol</h1>
        <p className="whitepaper-subtitle">A decentralized infrastructure for artist empowerment, transparent ownership, and community-driven engagement</p>
      </div>

      <div className="whitepaper-container">
        <div className="toc">
          <h2>Table of Contents</h2>
          <ul className="toc-list">
            <li className="toc-item">
              <a href="#executive-summary" className="toc-link">
                <span className="toc-number">1</span>
                <span>Summary</span>
              </a>
            </li>
            <li className="toc-item">
              <a href="#problem-statement" className="toc-link">
                <span className="toc-number">2</span>
                <span>Problem Statement</span>
              </a>
            </li>
            <li className="toc-item">
              <a href="#solution-overview" className="toc-link">
                <span className="toc-number">3</span>
                <span>Solution Overview</span>
              </a>
            </li>
            <li className="toc-item">
              <a href="#technical-architecture" className="toc-link">
                <span className="toc-number">4</span>
                <span>Technical Architecture</span>
              </a>
            </li>
            <li className="toc-item">
              <a href="#economic-model" className="toc-link">
                <span className="toc-number">5</span>
                <span>Economic Model</span>
              </a>
            </li>
            <li className="toc-item">
              <a href="#use-cases" className="toc-link">
                <span className="toc-number">6</span>
                <span>Use Cases</span>
              </a>
            </li>
            <li className="toc-item">
              <a href="#legal-regulatory" className="toc-link">
                <span className="toc-number">7</span>
                <span>Legal & Regulatory Considerations</span>
              </a>
            </li>
            <li className="toc-item">
              <a href="#conclusion" className="toc-link">
                <span className="toc-number">8</span>
                <span>Conclusion</span>
              </a>
            </li>
          </ul>
        </div>

        <section id="executive-summary" className="whitepaper-section">
          <h2 className="section-title">1. Summary</h2>
          <p>The Artist Ownership & Social Engagement Protocol ("the Protocol") is a decentralized infrastructure designed to empower artists by enabling direct monetization, transparent ownership, and community-driven interaction. Through tokenized artwork representation and integrated social features, the Protocol provides a sustainable ecosystem where artists can own their work, share revenue with supporters, and build authentic fan relationships.</p>

          <div className="callout">
            <h3 className="callout-title">Core Vision</h3>
            <p>Base-Music reimagines the relationship between artists and their communities by creating a framework where creative value is transparently shared, fans become active participants in artist success, and authentic engagement flourishes outside platform-controlled algorithms.</p>
          </div>
        </section>

        <section id="problem-statement" className="whitepaper-section">
          <h2 className="section-title">2. Problem Statement</h2>
          <p>Traditional digital platforms limit artist control, offering low revenue shares, opaque ownership rights, and weak mechanisms for engaging and rewarding fans. Key problems include:</p>
          <ul className="bullet-list">
            <li><strong>Lack of ownership transparency:</strong> Artists have minimal control over their creative assets once uploaded to platforms.</li>
            <li><strong>Platform-controlled monetization models:</strong> Revenue split heavily favors platforms over creators.</li>
            <li><strong>Difficulty building direct artist-fan relationships:</strong> Platform algorithms and interfaces create barriers between artists and their true supporters.</li>
            <li><strong>Limited ability for fans to support or benefit from artist growth:</strong> No mechanisms for fans to materially participate in artist success.</li>
          </ul>

          <div className="diagram">
            <h3>The Current Music Ecosystem</h3>
            <img src="/images/before.png" alt="Current Music Ecosystem" />
          </div>
        </section>

        <section id="solution-overview" className="whitepaper-section">
          <h2 className="section-title">3. Solution Overview</h2>
          <p>The Protocol addresses these issues through a blockchain-based model offering:</p>

          <h3 className="subsection-title">Tokenized Ownership</h3>
          <p>Each uploaded artwork is represented by a unique, tradeable NFT (or equivalent token standard). This creates verifiable provenance and clear ownership rights managed by creators rather than platforms.</p>

          <h3 className="subsection-title">Revenue Distribution</h3>
          <p>Smart contracts automate revenue sharing with token holders based on artist-defined rules. This enables transparent, immutable distribution of income from various sources including streams, downloads, and licensing.</p>

          <h3 className="subsection-title">Social Layer</h3>
          <p>Embedded tools for interaction, content sharing, fan voting, and messaging to deepen fan engagement. Unlike traditional platforms, these connections remain intact regardless of algorithm changes.</p>

          <h3 className="subsection-title">Decentralized Governance</h3>
          <p>Artists and token holders participate in governance over platform evolution. This ensures the protocol serves creator interests rather than extractive corporate motives.</p>

          <div className="diagram">
            <h3>The Base-Music Ecosystem</h3>
            <img src="/images/after.png" alt="Current Music Ecosystem" />
          </div>
        </section>

        <section id="technical-architecture" className="whitepaper-section">
          <h2 className="section-title">4. Technical Architecture</h2>

          <h3 className="subsection-title">4.1 Token Standards</h3>
          <ul className="bullet-list">
            <li><strong>ERC-721 or ERC-1155 NFTs</strong> for artwork representation</li>
            <li><strong>Fungible tokens (optional)</strong> for fractionalized ownership or community rewards</li>
          </ul>

          <h3 className="subsection-title">4.2 Smart Contracts</h3>
          <ul className="bullet-list">
            <li><strong>Ownership Contract:</strong> Manages minting, metadata, and transfers</li>
            <li><strong>Revenue Distribution Contract:</strong> Automatically allocates income to token holders</li>
            <li><strong>Engagement Modules:</strong> Incentivize fans to participate via social tokens or reputation scores</li>
          </ul>

          <h3 className="subsection-title">4.3 Data Storage</h3>
          <ul className="bullet-list">
            <li><strong>Off-chain media</strong> via IPFS/Arweave</li>
            <li><strong>On-chain metadata</strong> and transaction logs</li>
          </ul>

          <h3 className="subsection-title">4.4 Identity & Social Tools</h3>
          <ul className="bullet-list">
            <li><strong>Artist and fan profiles</strong></li>
            <li><strong>Commenting, sharing, and tipping mechanisms</strong></li>
            <li><strong>Follower graphs and engagement analytics</strong></li>
          </ul>

          <div className="diagram">
            <h3>Technical Architecture Overview</h3>
            <img src="/images/protocol.png" alt="Current Music Ecosystem" />
          </div>
        </section>

        <section id="economic-model" className="whitepaper-section">
          <h2 className="section-title">5. Economic Model</h2>

          <h3 className="subsection-title">5.1 Artist Incentives</h3>
          <ul className="bullet-list">
            <li><strong>Full creative ownership</strong> with ability to set terms</li>
            <li><strong>Revenue from primary and secondary sales</strong> with royalty enforcement</li>
            <li><strong>Direct support from fans</strong> through subscriptions, donations, and patronage</li>
          </ul>

          <h3 className="subsection-title">5.2 Fan Participation</h3>
          <ul className="bullet-list">
            <li><strong>Earn rewards</strong> via engagement, early support, or content curation</li>
            <li><strong>Stake in artist success</strong> via token appreciation as creators gain recognition</li>
          </ul>

          <h3 className="subsection-title">5.3 Platform Fees</h3>
          <ul className="bullet-list">
            <li><strong>Low, transparent fees</strong> for transaction facilitation and maintenance</li>
          </ul>

          <table>
            <tr>
              <th>Fee Type</th>
              <th>Amount</th>
              <th>Recipient</th>
              <th>Purpose</th>
            </tr>
            <tr>
              <td>Primary Sale</td>
              <td>2.5%</td>
              <td>Protocol Treasury</td>
              <td>Platform operation and development</td>
            </tr>
            <tr>
              <td>Secondary Sale</td>
              <td>1%</td>
              <td>Protocol Treasury</td>
              <td>Platform operation and development</td>
            </tr>
            <tr>
              <td>Creator Royalty</td>
              <td>5-10% (artist-defined)</td>
              <td>Original Creator</td>
              <td>Ongoing artist support</td>
            </tr>
          </table>
        </section>

        <section id="use-cases" className="whitepaper-section">
          <h2 className="section-title">6. Use Cases</h2>

          <div className="callout">
            <h3 className="callout-title">Independent Musicians</h3>
            <p>Upload songs, sell royalty-sharing tokens to finance recording and promotion, and allow early supporters to benefit from growing popularity.</p>
          </div>

          <div className="callout">
            <h3 className="callout-title">Digital Visual Artists</h3>
            <p>Mint artwork, engage collectors and patrons through token-gated experiences and exclusive content.</p>
          </div>

          <div className="callout">
            <h3 className="callout-title">Writers & Poets</h3>
            <p>Publish serialized content, allowing readers to co-own publications and participate in creative direction.</p>
          </div>
        </section>

        <section id="legal-regulatory" className="whitepaper-section">
          <h2 className="section-title">7. Legal & Regulatory Considerations</h2>
          <ul className="bullet-list">
            <li><strong>KYC/AML for token sales</strong> (if applicable)</li>
            <li><strong>Compliance with securities law</strong> for revenue-sharing tokens</li>
            <li><strong>IP rights management</strong> for uploaded content</li>
          </ul>

          <div className="callout">
            <h3 className="callout-title">Legal Framework</h3>
            <p>The protocol is designed with compliance in mind, implementing necessary guardrails while maximizing creator freedom and economic opportunity. We're working with legal experts in blockchain, intellectual property, and securities law to ensure our model protects all participants.</p>
          </div>
        </section>

        <section id="conclusion" className="whitepaper-section">
          <h2 className="section-title">8. Conclusion</h2>
          <p>The Artist Ownership & Social Engagement Protocol is a next-generation infrastructure that reimagines how artists earn, connect, and grow. By aligning incentives between creators and their communities, it opens new paths for sustainable digital creativity.</p>

          <div className="callout">
            <h3 className="callout-title">Join the Movement</h3>
            <p>We invite artists, fans, developers, and industry stakeholders to join us in building this new creative economy. Together, we can create a more equitable, transparent, and community-driven future for digital art.</p>
          </div>
        </section>
      </div>

      <footer>
        <div className="footer-content">
          <p>© 2025 Base-Music. All rights reserved.</p>
        </div>
      </footer>
    </>
  );
}

export default Whitepaper;