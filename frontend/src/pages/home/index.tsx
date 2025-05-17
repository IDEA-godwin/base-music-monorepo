
function Home() {
   return (
      <>
         <section className="features">
            <div className="section-title">
               <h2 className='viga-header'>Redefining Artistic Ownership</h2>
               <p>Our protocol transforms how creators monetize and maintain control over their work</p>
            </div>

            <div className="feature-grid">
               <div className="feature-card">
                  <div className="feature-icon">🔗</div>
                  <h3 className="feature-title">Tokenized Ownership</h3>
                  <p>Secure a unique digital token representing your creative work, establishing immutable proof of ownership on the blockchain.</p>
               </div>

               <div className="feature-card">
                  <div className="feature-icon">💰</div>
                  <h3 className="feature-title">Automated Revenue Sharing</h3>
                  <p>Receive direct revenue shares from your work through smart contracts - no middlemen, no delays, complete transparency.</p>
               </div>

               <div className="feature-card">
                  <div className="feature-icon">🌐</div>
                  <h3 className="feature-title">Community Building</h3>
                  <p>Connect directly with your audience, fostering meaningful relationships while maintaining creative control.</p>
               </div>
            </div>
         </section>

         <section className="how-it-works">
            <div className="section-title">
               <h2 className='viga-header'>How It Works</h2>
               <p>Three simple steps to revolutionize your creative journey</p>
            </div>

            <div className="steps-container">
               <div className="step">
                  <div className="step-number">1</div>
                  <div className="step-content">
                     <h3>Upload Your Art</h3>
                     <p>Submit your creative work to our platform - whether it's visual art, music, writing, or other digital creations. Our system securely stores your content while maintaining your access control preferences.</p>
                  </div>
               </div>

               <div className="step">
                  <div className="step-number">2</div>
                  <div className="step-content">
                     <h3>Receive Your Ownership Token</h3>
                     <p>Upon verification, our protocol generates a unique digital token tied to your artwork, which serves as immutable proof of your creation and ownership rights.</p>
                  </div>
               </div>

               <div className="step">
                  <div className="step-number">3</div>
                  <div className="step-content">
                     <h3>Earn & Connect</h3>
                     <p>As your work generates revenue through views, licenses, or sales, smart contracts automatically distribute earnings to your wallet. Simultaneously, engage with your audience through built-in social features.</p>
                  </div>
               </div>
            </div>
         </section>

         <section className="benefits">
            <div className="section-title">
               <h2 className='viga-header'>Benefits for Artists</h2>
               <p>Take control of your creative journey</p>
            </div>

            <div className="benefit-grid">
               <div className="benefit-card">
                  <h3>Guaranteed Attribution</h3>
                  <p>Your ownership is permanently recorded on the blockchain, ensuring your creative legacy remains intact regardless of how widely your work is shared.</p>
               </div>

               <div className="benefit-card">
                  <h3>Direct Revenue Stream</h3>
                  <p>Eliminate middlemen and receive fair compensation directly whenever your work is used, viewed, or purchased.</p>
               </div>

               <div className="benefit-card">
                  <h3>Community Development</h3>
                  <p>Build genuine connections with fans and supporters who appreciate your work, fostering a sustainable creative ecosystem.</p>
               </div>

               <div className="benefit-card">
                  <h3>Creative Freedom</h3>
                  <p>Focus on creating what you love without compromising your vision to satisfy third-party platforms or distributors.</p>
               </div>

               <div className="benefit-card">
                  <h3>Secondary Sales Revenue</h3>
                  <p>Earn royalties from secondary sales and transfers of your work, creating lasting passive income streams.</p>
               </div>

               <div className="benefit-card">
                  <h3>Data Insights</h3>
                  <p>Gain valuable analytics on how your audience engages with your work to inform future creative decisions.</p>
               </div>
            </div>
         </section>

         <section className="testimonials">
            <div className="section-title">
               <h2>From Our Community</h2>
               <p>Hear from creators already transforming their artistic journey</p>
            </div>

            <div className="testimonial-grid">
               <div className="testimonial-card">
                  <p className="testimonial-text">"For the first time in my 15-year career, I feel like I have complete ownership over my work. The revenue sharing has been transformative for my financial stability as an independent artist."</p>
                  <div className="testimonial-author">
                     <div className="author-avatar">JM</div>
                     <div>
                        <div className="author-name">Jamie Morrison</div>
                        <div className="author-title">Digital Artist</div>
                     </div>
                  </div>
               </div>
               <div className="testimonial-card">
                  <p className="testimonial-text">"The social features have connected me with fans I never would have reached otherwise. Now I'm not just creating art - I'm building a sustainable community around my work."</p>
                  <div className="testimonial-author">
                     <div className="author-avatar">SL</div>
                     <div>
                        <div className="author-name">Sarah Lin</div>
                        <div className="author-title">Musician & Composer</div>
                     </div>
                  </div>
               </div>
            </div>
         </section>

         <footer>
            <div className="footer-content">
               <h3>Ready to transform your creative journey?</h3>
               <p>Join thousands of artists taking control of their work with <span className="viga-header">Base Music</span></p>
               <a href="#" className="btn btn-primary">Get Started Today</a>

               <div className="footer-links">
                  <a href="#">About Us</a>
                  <a href="#">How It Works</a>
                  <a href="#">For Artists</a>
                  <a href="#">For Fans</a>
                  <a href="#">FAQ</a>
                  <a href="#">Contact</a>
               </div>

               <div className="copyright">
                  © 2025 Base-Music. All rights reserved.
               </div>
            </div>
         </footer>
      </>
   )
}

export default Home