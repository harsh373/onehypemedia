import Hero from '../components/Hero'
import Intro from '../components/Intro'
import Capabilities from '../components/Capabilities'
import Approach from '../components/Approach'
//import HypeLab from '../components/Hypelab'
//import Manifesto from '../components/Manifesto'
import FinalCTA from '../components/FinalCTA'
import Footer from '../components/Footer'

export default function Home() {
  return (
    <main>
      <Hero />
      <Intro />
      <Capabilities />
      <Approach />
     
      
      <FinalCTA />
      <Footer/>

    </main>
  )
}