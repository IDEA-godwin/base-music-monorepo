
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

function NotFound() {
   	return (
		<div className="bg-gradient-to-br from-[#161616] to-[#000512]">
				<div className="relative h-screen w-full flex flex-col items-center justify-center  px-6 text-white text-center overflow-hidden">
					{/* Brand name - aboki.eth */}
					<motion.div
						className="absolute top-8 left-8 z-20"
						initial={{ opacity: 0, y: -20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.2, duration: 0.6 }}
					>
						<h2 className="text-2xl font-bold">
							ABOKI
							<span className="text-[#4169E1]">.ETH</span>
						</h2>
					</motion.div>

					{/* Main content */}
					<div className="relative z-10">
						<motion.div
							initial={{ scale: 0.8 }}
							animate={{ scale: 1 }}
							transition={{ type: "spring", stiffness: 100, damping: 10 }}
						>
							<motion.img
								src="/404-illustration.svg"
								alt="Not Found"
								loading="lazy"
								initial={{ y: -10 }}
								animate={{
									y: [-10, 15, -10],
									rotate: [0, 5, -5, 0],
								}}
								transition={{
									duration: 6,
									ease: "easeInOut",
									repeat: Infinity,
									rotate: {
										duration: 8,
										repeat: Infinity,
									},
								}}
								className="w-72 md:w-96 mb-6 aspect-[4/3] drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]"
							/>
						</motion.div>

						<motion.div
							initial={{ y: 20 }}
							animate={{ y: 0 }}
							transition={{ delay: 0.3, duration: 0.6 }}
						>
							<motion.h1
								className="text-5xl md:text-7xl font-extrabold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-white to-cyan-200"
								animate={{
									textShadow: [
										"0 0 10px rgba(255,255,255,0.3)",
										"0 0 20px rgba(255,255,255,0.5)",
										"0 0 10px rgba(255,255,255,0.3)",
									],
								}}
								transition={{
									duration: 3,
									repeat: Infinity,
								}}
							>
								404
							</motion.h1>

							<motion.p className="text-lg md:text-xl text-gray-300 mb-8 max-w-md md:max-w-xl">
								Oops! Looks like you're lost in space. The page you're looking
								for doesn't exist.
							</motion.p>

							<motion.div
								initial={{ y: 20 }}
								animate={{ y: 0 }}
								transition={{ delay: 0.8, duration: 0.4 }}
							>
								<Link
									to="/"
									className="px-8 py-3 bg-white font-semibold rounded-full text-[#4169E1] hover:bg-[#4169E1] hover:text-white transition duration-300 relative overflow-hidden"
								>
									Return Home
								</Link>
							</motion.div>
						</motion.div>
					</div>

					{/* Floating astronaut (optional) */}
					<motion.div
						className="absolute hidden md:block"
						style={{
							right: "5%",
							top: "30%",
						}}
						initial={{ y: -50, rotate: -15 }}
						animate={{
							y: [-50, 50, -50],
							rotate: [-15, 15, -15],
						}}
						transition={{
							duration: 10,
							ease: "easeInOut",
							repeat: Infinity,
							rotate: {
								duration: 8,
								repeat: Infinity,
							},
						}}
					>
						<img
							src="/Astronaut.svg"
							alt="Astronaut"
							loading="lazy"
							className="w-24 opacity-80"
						/>
					</motion.div>
				</div>
		</div>
	);
}

export default NotFound;