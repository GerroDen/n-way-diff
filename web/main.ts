import "primevue/resources/themes/saga-blue/theme.css"
import "primevue/resources/primevue.min.css"
import "primeicons/primeicons.css"
import {createApp} from "vue"
import App from "./App.vue"
import PrimeVue from "primevue/config"

createApp(App)
    .use(PrimeVue, {ripple: true})
    .mount('#app')
