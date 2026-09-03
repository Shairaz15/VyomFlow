import xgboost as xgb
import onnx
import onnxmltools
from onnxmltools.convert import convert_xgboost
from onnxmltools.convert.common.data_types import FloatTensorType

def main():
    model_path = "../public/models/nacc-xgboost/xgboost_model.json"
    onnx_path = "../public/models/nacc-xgboost/xgboost_model.onnx"

    print("Loading XGBoost model...")
    # Load the trained model
    model = xgb.XGBClassifier()
    model.load_model(model_path)

    # 19 features were used during training
    # DEMOGRAPHICS(3) + EPISODIC_MEMORY(4) + LANGUAGE(4) + EXECUTIVE(3) + ATTENTION(3) + VISUOSPATIAL(3) = 20? 
    # Wait, earlier scripts said: 
    # DEMOGRAPHICS = ['NACCAGE', 'EDUC', 'SEX'] (3)
    # EPISODIC = ['CRAFTVRS', 'CRAFTDVR', 'UDSBENTC', 'UDSBENTD'] (4)
    # LANGUAGE = ['ANIMALS', 'VEG', 'MOCAFLUE', 'MINTTOTS'] (4)
    # EXECUTIVE = ['TRAILA', 'TRAILB', 'WAIS'] (3)
    # ATTENTION = ['DIGIFLEN', 'DIGIBLEN', 'MOCALETT'] (3)
    # VISUOSPATIAL = ['MOCACUBE', 'MOCACLOC', 'ORIENT'] (3)
    # Total = 3+4+4+3+3+3 = 20. But in validation: 19 features? (MINTTOTS might be missing in dataset).
    # We can inspect the model's expected number of features
    num_features = model.get_booster().num_features()
    print(f"Model expects {num_features} features.")

    # Convert to ONNX
    print("Converting to ONNX...")
    initial_types = [('float_input', FloatTensorType([None, num_features]))]
    
    # We pass the booster
    onnx_model = convert_xgboost(
        model, 
        initial_types=initial_types, 
        target_opset=15  # Match supported opset
    )

    print(f"Saving ONNX model to {onnx_path}...")
    onnxmltools.utils.save_model(onnx_model, onnx_path)
    print("Export complete.")

if __name__ == "__main__":
    main()
