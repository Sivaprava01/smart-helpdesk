# Phase 5 Testing & Verification Guide: Assignment Lifecycle & Fallback Rerouting

This document details the test strategy, automated suites, and verified results for Phase 5.

---

## 1. Test Strategy & Transaction Isolation

- **In-Memory SQLite Fixtures**: Tests execute against ephemeral in-memory SQLite instances using `StaticPool` and FastAPI dependency overrides, guaranteeing complete test isolation without modifying the development database.
- **State Transition Verification**: Every assignment lifecycle path (`OFFERED` -> `ACCEPTED`, `OFFERED` -> `DECLINED` -> `FALLBACK`, `OFFERED` -> `DEFERRED` -> `ACCEPTED`, `OFFERED` -> `EXPIRED` -> `FALLBACK`) is tested with explicit database assertions on ticket status and technician workload.
- **Regression Safety**: All test suites from Phase 1 through Phase 4 are executed on every build to guarantee zero regressions.

---

## 2. Automated Test Suite Summary

| Test File | Test Focus | Tests Count | Status |
|---|---|:---:|:---:|
| [`tests/test_assignment_service.py`](../../tests/test_assignment_service.py) | Initial offer, active offer guard, future scheduled ticket guard, acceptance, workload increment, decline, fallback with live data, ask-me-later deferral, timeout processing | 8 | **PASSED** |
| [`tests/test_assignments_api.py`](../../tests/test_assignments_api.py) | Full HTTP API integration for assign, accept, decline, ask-later, process-expired, and assignment attempt history retrieval | 4 | **PASSED** |
| [`tests/test_routing_api.py`](../../tests/test_routing_api.py) | Phase 4 Routing preview API integration & read-only guarantee | 5 | **PASSED** |
| [`tests/test_routing_eligibility.py`](../../tests/test_routing_eligibility.py) | Phase 4 Eligibility filtering rules | 7 | **PASSED** |
| [`tests/test_routing_ranking.py`](../../tests/test_routing_ranking.py) | Phase 4 Ranking & deterministic tie-breaking | 3 | **PASSED** |
| [`tests/test_routing_scoring.py`](../../tests/test_routing_scoring.py) | Phase 4 Scoring formulas & normalization | 6 | **PASSED** |
| [`tests/test_routing_service.py`](../../tests/test_routing_service.py) | Phase 4 Routing service orchestration | 4 | **PASSED** |
| [`tests/test_lifecycle_api.py`](../../tests/test_lifecycle_api.py) | Phase 3 Ticket updates & cancellation safety | 6 | **PASSED** |
| [`tests/test_technicians_api.py`](../../tests/test_technicians_api.py) | Phase 3 Technician management APIs | 6 | **PASSED** |
| [`tests/test_tickets_api.py`](../../tests/test_tickets_api.py) | Phase 3 Ticket creation & reading APIs | 9 | **PASSED** |
| [`tests/test_customers_api.py`](../../tests/test_customers_api.py) | Phase 3 Customer APIs | 7 | **PASSED** |
| [`tests/test_categories_api.py`](../../tests/test_categories_api.py) | Phase 3 Service Category APIs | 4 | **PASSED** |
| [`tests/test_database.py`](../../tests/test_database.py) | Phase 2 Database models & constraints | 9 | **PASSED** |
| [`tests/test_health.py`](../../tests/test_health.py) | Phase 1 Health check endpoints | 4 | **PASSED** |
| **Total** | **Full Automated Test Suite** | **82** | **100% PASSED** |

---

## 3. Running the Complete Test Suite

```powershell
uv run pytest -v
```

### Verified Test Output:
```text
============================= test session starts =============================
platform win32 -- Python 3.13.7, pytest-9.1.1, pluggy-1.6.0
rootdir: backend
configfile: pyproject.toml
testpaths: tests
plugins: anyio-4.14.2
collected 82 items

tests/test_assignment_service.py::test_start_assignment_and_accept_workflow PASSED [  1%]
tests/test_assignment_service.py::test_start_assignment_scheduled_future_ticket_rejected PASSED [  2%]
tests/test_assignment_service.py::test_accept_assignment_expired_rejected PASSED [  3%]
tests/test_assignment_service.py::test_accept_assignment_wrong_technician_rejected PASSED [  4%]
tests/test_assignment_service.py::test_decline_assignment_and_live_fallback_rerouting PASSED [  6%]
tests/test_assignment_service.py::test_fallback_uses_live_updated_data_skips_off_duty_candidate PASSED [  7%]
tests/test_assignment_service.py::test_defer_assignment_ask_later_workflow PASSED [  8%]
tests/test_assignment_service.py::test_process_expired_assignments_and_fallback PASSED [  9%]
tests/test_assignments_api.py::test_api_initial_assignment_and_accept PASSED [ 10%]
tests/test_assignments_api.py::test_api_decline_and_fallback_rerouting PASSED [ 12%]
tests/test_assignments_api.py::test_api_ask_later_and_accept PASSED      [ 13%]
tests/test_assignments_api.py::test_api_process_expired_assignments PASSED [ 14%]
tests/test_categories_api.py::test_create_category_success PASSED        [ 15%]
tests/test_categories_api.py::test_create_category_duplicate_rejected PASSED [ 17%]
tests/test_categories_api.py::test_list_and_filter_categories PASSED     [ 18%]
tests/test_categories_api.py::test_get_and_update_category PASSED        [ 19%]
tests/test_customers_api.py::test_create_customer_success PASSED         [ 20%]
tests/test_customers_api.py::test_create_customer_invalid_email PASSED   [ 21%]
tests/test_customers_api.py::test_create_customer_duplicate_email PASSED [ 23%]
tests/test_customers_api.py::test_get_customer_success PASSED            [ 24%]
tests/test_customers_api.py::test_get_customer_not_found PASSED          [ 25%]
tests/test_customers_api.py::test_list_customers PASSED                  [ 26%]
tests/test_customers_api.py::test_update_customer PASSED                 [ 28%]
tests/test_database.py::test_base_model_uuid_and_timestamp_generation PASSED [ 29%]
tests/test_database.py::test_customer_creation_and_fields PASSED         [ 30%]
tests/test_database.py::test_customer_unique_email_and_phone PASSED      [ 31%]
tests/test_database.py::test_technician_creation_and_defaults PASSED     [ 32%]
tests/test_database.py::test_technician_service_category_many_to_many PASSED [ 34%]
tests/test_database.py::test_ticket_creation_and_relationships PASSED    [ 35%]
tests/test_database.py::test_technician_assignment_history PASSED        [ 36%]
tests/test_database.py::test_customer_technician_history_and_uniqueness PASSED [ 37%]
tests/test_database.py::test_get_db_session_lifecycle PASSED             [ 39%]
tests/test_health.py::test_health_check_returns_200_and_healthy PASSED   [ 40%]
tests/test_health.py::test_docs_endpoints PASSED                         [ 41%]
tests/test_health.py::test_unhandled_exception_returns_safe_500 PASSED   [ 42%]
tests/test_health.py::test_not_found_route PASSED                        [ 43%]
tests/test_lifecycle_api.py::test_update_ticket_allowed_fields PASSED    [ 45%]
tests/test_lifecycle_api.py::test_update_ticket_scheduling PASSED        [ 46%]
tests/test_lifecycle_api.py::test_client_cannot_arbitrarily_set_status PASSED [ 47%]
tests/test_lifecycle_api.py::test_cancel_pending_ticket_success PASSED   [ 48%]
tests/test_lifecycle_api.py::test_cannot_update_cancelled_ticket PASSED  [ 50%]
tests/test_lifecycle_api.py::test_tickets_have_no_delete_endpoint PASSED [ 51%]
tests/test_routing_api.py::test_routing_preview_complete_flow PASSED     [ 52%]
tests/test_routing_api.py::test_routing_preview_get_and_post_parity PASSED [ 53%]
tests/test_routing_api.py::test_routing_preview_nonexistent_ticket_fails PASSED [ 54%]
tests/test_routing_api.py::test_routing_preview_cancelled_ticket_fails PASSED [ 56%]
tests/test_routing_api.py::test_routing_preview_is_strictly_read_only PASSED [ 57%]
tests/test_routing_eligibility.py::test_eligible_technician_passes_all_checks PASSED [ 58%]
tests/test_routing_eligibility.py::test_inactive_technician_is_excluded PASSED [ 59%]
tests/test_routing_eligibility.py::test_off_duty_technician_is_excluded PASSED [ 60%]
tests/test_routing_eligibility.py::test_unsupported_category_is_excluded PASSED [ 62%]
tests/test_routing_eligibility.py::test_max_workload_reached_is_excluded PASSED [ 63%]
tests/test_routing_eligibility.py::test_multiple_exclusion_reasons_returned PASSED [ 64%]
tests/test_routing_eligibility.py::test_filter_eligible_technicians_pool PASSED [ 65%]
tests/test_routing_ranking.py::test_ranking_empty_pool PASSED            [ 67%]
tests/test_routing_ranking.py::test_ranking_order_and_recommendation PASSED [ 68%]
tests/test_routing_ranking.py::test_deterministic_tie_breaking_identical_scores PASSED [ 69%]
tests/test_routing_scoring.py::test_compute_location_score PASSED        [ 70%]
tests/test_routing_scoring.py::test_compute_rating_score PASSED          [ 71%]
tests/test_routing_scoring.py::test_compute_history_score PASSED         [ 73%]
tests/test_routing_scoring.py::test_compute_reopen_score PASSED          [ 74%]
tests/test_routing_scoring.py::test_compute_workload_score PASSED        [ 75%]
tests/test_routing_scoring.py::test_calculate_candidate_score_total_and_breakdown PASSED [ 76%]
tests/test_routing_service.py::test_evaluate_ticket_routing_full_flow PASSED [ 78%]
tests/test_routing_service.py::test_evaluate_nonexistent_ticket_raises_not_found PASSED [ 79%]
tests/test_routing_service.py::test_evaluate_non_routable_ticket_raises_error PASSED [ 80%]
tests/test_routing_service.py::test_evaluate_ticket_with_zero_eligible_candidates PASSED [ 81%]
tests/test_technicians_api.py::test_create_technician_with_categories PASSED [ 82%]
tests/test_technicians_api.py::test_create_technician_nonexistent_category_fails PASSED [ 84%]
tests/test_technicians_api.py::test_create_technician_duplicate_email PASSED [ 85%]
tests/test_technicians_api.py::test_get_technician_success_and_not_found PASSED [ 86%]
tests/test_technicians_api.py::test_list_technicians_and_filters PASSED  [ 87%]
tests/test_technicians_api.py::test_update_technician_skills_and_status PASSED [ 89%]
tests/test_tickets_api.py::test_create_asap_ticket_success PASSED        [ 90%]
tests/test_tickets_api.py::test_create_scheduled_ticket_success PASSED   [ 91%]
tests/test_tickets_api.py::test_create_scheduled_ticket_missing_time_fails PASSED [ 92%]
tests/test_tickets_api.py::test_create_asap_ticket_with_time_fails PASSED [ 93%]
tests/test_tickets_api.py::test_create_scheduled_ticket_past_time_fails PASSED [ 95%]
tests/test_tickets_api.py::test_create_ticket_nonexistent_references PASSED [ 96%]
tests/test_tickets_api.py::test_create_ticket_inactive_category_fails PASSED [ 97%]
tests/test_tickets_api.py::test_get_ticket_and_status PASSED             [ 98%]
tests/test_tickets_api.py::test_list_tickets_and_filters PASSED          [100%]

======================== 82 passed, 1 warning in 3.65s ========================
```
