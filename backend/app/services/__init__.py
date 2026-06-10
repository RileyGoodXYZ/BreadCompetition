"""Service layer — logic too heavy or cross-cutting for a router.

Routers stay thin (HTTP in, HTTP out); anything that talks to an external
system or aggregates across tables lives here. First inhabitant: the TBA sync
(`tba.py`).
"""
