import 'zone.js'
import { bootstrapApplication } from '@angular/platform-browser'
import { AppComponent } from './app/app.component'
import './styles.css'

bootstrapApplication(AppComponent).catch((err) => console.error(err))

