import { useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { storeTargetActionId } from "../../utils/actionDeepLink";

export default function ActionRedirect() {
  const { actionId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (actionId) {
      storeTargetActionId(actionId);
    }

    navigate("/", { replace: true });
  }, [actionId, navigate]);

  return null;
}
