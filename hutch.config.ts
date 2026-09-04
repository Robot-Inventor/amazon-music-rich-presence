export default {
    scripts: {
        build: "hutch electrobun prepare && hutch pm exec -- vite build && hutch electrobun build --env=stable",
        dev: "hutch electrobun prepare && hutch pm exec -- vite build && hutch electrobun dev --watch",
        "dev:hmr": ["hutch", "pm", "exec", "--", "concurrently", "hutch run hmr", "hutch run start"],
        hmr: "hutch electrobun prepare && hutch pm exec -- vite --port 5173",
        start: "hutch electrobun prepare && hutch pm exec -- vite build && hutch electrobun dev"
    }
};
