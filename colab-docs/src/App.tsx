import WrapperRouter from './router/router.tsx'
import { Toaster } from 'react-hot-toast';

export default function App () {
  return (
    <>
      <WrapperRouter/>
      <Toaster/>
    </>

  )
}