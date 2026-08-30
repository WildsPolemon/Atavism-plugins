# FANUC alarm data sources used

The expanded FANUC knowledge catalog was aligned to public references and alarm-family structures from:

1. https://www.scribd.com/document/478553866/B-64305EN-01-Maintenance-Manual-0i-D
2. https://www.scribd.com/document/721458544/Fanuc-0i-0iMate-Model-D-Alarm-List
3. https://www.versabuilt.com/wp-content/uploads/2026/06/Fanuc-CNC-Alarm-Codes.pdf
4. https://zappettiniconsulting.com/wiki/fanuc-alarms-diagnostics
5. https://jjautomation.in/blogs/fanuc/fanuc-0i-model-d-alarm-list
6. https://jjautomation.in/blogs/fanuc/fanuc-31i-model-a-alarm-list

Notes:
- The app now seeds broad code-family coverage for FANUC prefixes PS/SV/OT/OH/DS/SP/PW/SW.
- Family coverage is generated in code (`FanucAlarmCatalog`) to avoid brittle static duplication and to keep revisions consistent.
- OEM service manuals remain the final authority for machine-builder-specific ladder/PMC variants.
